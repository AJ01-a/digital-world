import { useEffect, useRef } from 'react';
import { clamp, lerp, rand } from '../lib/utils';

interface Dash { z: number }
interface Post { z: number; side: -1 | 1 }
interface Car { z: number; lane: number; speed: number }

/**
 * A quiet night drive. Everything is drawn from a single vanishing point;
 * moving the pointer (or tilting the section into view) steers gently.
 */
export default function RoadCanvas({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const parent = canvas.parentElement!;

    let w = 0;
    let h = 0;
    let raf = 0;
    let last = performance.now();
    let t = 0;
    let visible = true;
    let steer = 0;
    let steerTarget = 0;

    const dashes: Dash[] = Array.from({ length: 26 }, (_, i) => ({ z: i / 26 }));
    const posts: Post[] = Array.from({ length: 22 }, (_, i) => ({ z: i / 22, side: i % 2 === 0 ? -1 : 1 }));
    const cars: Car[] = Array.from({ length: 3 }, () => ({ z: rand(0.3, 1), lane: rand(-0.55, -0.2), speed: rand(0.16, 0.3) }));

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onMove = (e: PointerEvent) => {
      const rect = parent.getBoundingClientRect();
      steerTarget = clamp(((e.clientX - rect.left) / rect.width - 0.5) * 2, -1, 1);
    };

    const start = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    }, { threshold: 0.05 });

    // Perspective: 0 = horizon, 1 = at the camera.
    const persp = (z: number) => Math.pow(1 - z, 2.6);

    function frame(now: number) {
      // With reduced motion the scene is painted once and left alone.
      raf = reduced ? 0 : requestAnimationFrame(frame);
      if (!visible) return;
      // Clamped: a frame timestamp can predate the last reset, and a
      // negative delta would run the scene backwards into NaN.
      const dt = reduced ? 0 : Math.min(Math.max((now - last) / 1000, 0), 0.05);
      last = now;
      const speed = 0.42;
      t += dt;
      steer += (steerTarget - steer) * Math.min(1, dt * 2.2);

      const horizon = h * 0.4;
      const vpX = w / 2 + steer * w * 0.07 + Math.sin(t * 0.22) * w * 0.012;
      const farHalf = w * 0.014;
      const nearHalf = w * 0.86;
      const centerAt = (p: number) => lerp(vpX, w / 2 + steer * w * 0.02, p);
      const halfAt = (p: number) => lerp(farHalf, nearHalf, p);

      ctx.clearRect(0, 0, w, h);

      // Distant glow on the horizon.
      const sky = ctx.createLinearGradient(0, horizon - h * 0.3, 0, horizon + h * 0.08);
      sky.addColorStop(0, 'rgba(0,0,0,0)');
      sky.addColorStop(1, 'rgba(120,190,255,0.16)');
      ctx.fillStyle = sky;
      ctx.fillRect(0, horizon - h * 0.3, w, h * 0.38);

      // Road surface.
      ctx.beginPath();
      ctx.moveTo(vpX - farHalf, horizon);
      ctx.lineTo(vpX + farHalf, horizon);
      ctx.lineTo(centerAt(1) + nearHalf, h);
      ctx.lineTo(centerAt(1) - nearHalf, h);
      ctx.closePath();
      const road = ctx.createLinearGradient(0, horizon, 0, h);
      road.addColorStop(0, 'rgba(18,22,40,0.9)');
      road.addColorStop(1, 'rgba(6,8,16,0.98)');
      ctx.fillStyle = road;
      ctx.fill();

      // Edge lines.
      ctx.globalCompositeOperation = 'lighter';
      for (const side of [-1, 1] as const) {
        ctx.beginPath();
        for (let i = 0; i <= 24; i++) {
          const p = persp(1 - i / 24);
          const x = centerAt(p) + side * halfAt(p);
          const y = horizon + p * (h - horizon);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(120,215,255,0.28)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Centre dashes.
      for (const d of dashes) {
        d.z -= speed * dt;
        if (d.z < 0) d.z += 1;
        const p = persp(d.z);
        const y = horizon + p * (h - horizon);
        const cx = centerAt(p);
        const dw = lerp(0.8, 16, p);
        const dh = lerp(1.5, 54, p);
        ctx.fillStyle = `rgba(230,240,255,${(0.1 + p * 0.5).toFixed(3)})`;
        ctx.fillRect(cx - dw / 2, y, dw, dh);
      }

      // Reflective posts along the shoulder.
      for (const post of posts) {
        post.z -= speed * dt;
        if (post.z < 0) post.z += 1;
        const p = persp(post.z);
        const y = horizon + p * (h - horizon);
        const x = centerAt(p) + post.side * halfAt(p) * 1.06;
        const r = lerp(0.6, 6, p);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
        g.addColorStop(0, `rgba(255,190,120,${(0.15 + p * 0.6).toFixed(3)})`);
        g.addColorStop(1, 'rgba(255,190,120,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // A couple of cars coming the other way.
      for (const car of cars) {
        car.z -= (speed + car.speed) * dt;
        if (car.z < 0) {
          car.z += 1;
          car.lane = rand(-0.6, -0.2);
          car.speed = rand(0.16, 0.3);
        }
        const p = persp(car.z);
        const y = horizon + p * (h - horizon) - lerp(1, 26, p);
        const x = centerAt(p) + car.lane * halfAt(p);
        const spread = lerp(1, 26, p);
        for (const off of [-spread, spread]) {
          const g = ctx.createRadialGradient(x + off, y, 0, x + off, y, lerp(2, 34, p));
          g.addColorStop(0, `rgba(220,240,255,${(0.2 + p * 0.7).toFixed(3)})`);
          g.addColorStop(1, 'rgba(180,220,255,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x + off, y, lerp(2, 34, p), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalCompositeOperation = 'source-over';

      // Fade the very bottom so the canvas melts into the section.
      const fade = ctx.createLinearGradient(0, h * 0.72, 0, h);
      fade.addColorStop(0, 'rgba(0,0,0,0)');
      fade.addColorStop(1, 'rgba(4,6,12,0.92)');
      ctx.fillStyle = fade;
      ctx.fillRect(0, h * 0.72, w, h * 0.28);
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    io.observe(parent);
    window.addEventListener('pointermove', onMove, { passive: true });
    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
    };
  }, [reduced]);

  return <canvas ref={ref} aria-hidden="true" className="absolute inset-0 h-full w-full" />;
}
