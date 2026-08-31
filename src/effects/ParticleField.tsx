import { useEffect, useRef } from 'react';
import type { ParticleMode } from '../data/worlds';
import { clamp, rand } from '../lib/utils';

interface RGB { r: number; g: number; b: number }

const hexToRgb = (hex: string): RGB => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

const mix = (a: RGB, b: RGB, t: number): RGB => ({
  r: a.r + (b.r - a.r) * t,
  g: a.g + (b.g - a.g) * t,
  b: a.b + (b.b - a.b) * t,
});

const css = (c: RGB, a: number) =>
  `rgba(${c.r | 0},${c.g | 0},${c.b | 0},${a.toFixed(3)})`;

interface P {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
  /** current opacity multiplier, eased toward `target` */
  o: number;
  target: number;
  rot: number;
  vr: number;
  seed: number;
  mode: ParticleMode;
  ch: string;
}

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const densityFor = (mode: ParticleMode) => {
  switch (mode) {
    case 'embers': return 0.000075;
    case 'motes': return 0.00006;
    case 'leaves': return 0.00004;
    case 'snow': return 0.00009;
    case 'mist': return 0.000016;
    case 'chess': return 0.00003;
    case 'letters': return 0.000028;
    case 'road': return 0.00005;
    case 'pollen': return 0.00007;
    case 'grid': return 0.00007;
    case 'neural': return 0.000035;
    default: return 0.00006;
  }
};

function spawn(mode: ParticleMode, w: number, h: number, fresh: boolean): P {
  const base: P = {
    x: rand(0, w), y: rand(0, h), z: rand(0.25, 1), vx: 0, vy: 0,
    r: 1, a: 1, o: fresh ? 0 : 1, target: 1, rot: rand(0, Math.PI * 2),
    vr: rand(-0.4, 0.4), seed: rand(0, 1000), mode, ch: GLYPHS[(Math.random() * 26) | 0],
  };

  switch (mode) {
    case 'motes':
      base.r = rand(0.6, 1.9); base.vy = rand(-7, -2); base.vx = rand(-3, 3); base.a = rand(0.15, 0.6);
      break;
    case 'embers':
      base.y = rand(h * 0.4, h + 60); base.r = rand(0.7, 2.3); base.vy = rand(-34, -12);
      base.vx = rand(-8, 8); base.a = rand(0.25, 0.9);
      break;
    case 'leaves':
      base.y = fresh ? rand(-80, h) : rand(-80, -10); base.r = rand(3, 7.5);
      base.vy = rand(14, 34); base.vx = rand(-16, -4); base.a = rand(0.2, 0.6);
      break;
    case 'snow':
      base.y = fresh ? rand(-40, h) : rand(-40, -5); base.r = rand(0.8, 2.6);
      base.vy = rand(12, 34); base.vx = rand(-10, 10); base.a = rand(0.25, 0.75);
      break;
    case 'mist':
      base.r = rand(120, 300); base.vx = rand(-9, 9); base.vy = rand(-3, 3); base.a = rand(0.05, 0.13);
      base.y = rand(h * 0.3, h);
      break;
    case 'chess':
      base.r = rand(7, 22); base.vy = rand(-6, -1); base.vx = rand(-2.5, 2.5); base.a = rand(0.06, 0.2);
      base.vr = rand(-0.16, 0.16);
      break;
    case 'letters':
      base.r = rand(9, 20); base.vy = rand(6, 18); base.vx = rand(-2, 2); base.a = rand(0.08, 0.28);
      base.y = fresh ? rand(-40, h) : rand(-60, -10);
      break;
    case 'road':
      base.r = rand(0.8, 2.4); base.a = rand(0.2, 0.75); base.z = rand(0.05, 1);
      break;
    case 'pollen':
      base.r = rand(1, 3.4); base.vy = rand(-9, -2); base.vx = rand(-5, 5); base.a = rand(0.15, 0.55);
      break;
    case 'grid':
      base.r = rand(0.8, 1.8); base.a = rand(0.15, 0.5); base.vy = rand(-4, 4); base.vx = rand(-4, 4);
      break;
    case 'neural':
      base.r = rand(1.2, 2.8); base.a = rand(0.3, 0.8); base.vx = rand(-9, 9); base.vy = rand(-9, 9);
      break;
  }
  return base;
}

export interface ParticleFieldProps {
  mode: ParticleMode;
  accent: string;
  ray: string;
  intensity: number;
}

export default function ParticleField({ mode, accent, ray, intensity }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef(mode);
  const colorRef = useRef({ accent, ray });
  const intensityRef = useRef(intensity);

  useEffect(() => { colorRef.current = { accent, ray }; }, [accent, ray]);
  useEffect(() => { intensityRef.current = intensity; }, [intensity]);

  /* Mode changes dissolve the current field and grow the next one, which
     is what makes one world melt into the next. */
  const pendingMode = useRef<ParticleMode | null>(null);
  useEffect(() => {
    if (modeRef.current !== mode) pendingMode.current = mode;
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true })!;
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let particles: P[] = [];
    let raf = 0;
    let last = performance.now();
    let running = true;
    let t = 0;

    const pointer = { x: -9999, y: -9999, sx: -9999, sy: -9999 };
    let cur = hexToRgb(colorRef.current.accent);
    let curRay = hexToRgb(colorRef.current.ray);

    /* Soft dots are drawn thousands of times a second, so they are baked
       into a sprite once per colour rather than rebuilt per particle. */
    const SPRITE = 64;
    const sprite = document.createElement('canvas');
    sprite.width = SPRITE;
    sprite.height = SPRITE;
    const sctx = sprite.getContext('2d')!;
    const snow = document.createElement('canvas');
    snow.width = SPRITE;
    snow.height = SPRITE;
    const snowCtx = snow.getContext('2d')!;
    let spriteKey = '';

    const paintSprite = (target: CanvasRenderingContext2D, c: RGB) => {
      target.clearRect(0, 0, SPRITE, SPRITE);
      const g = target.createRadialGradient(SPRITE / 2, SPRITE / 2, 0, SPRITE / 2, SPRITE / 2, SPRITE / 2);
      g.addColorStop(0, css(c, 1));
      g.addColorStop(0.35, css(c, 0.42));
      g.addColorStop(1, css(c, 0));
      target.fillStyle = g;
      target.fillRect(0, 0, SPRITE, SPRITE);
    };
    paintSprite(snowCtx, { r: 235, g: 244, b: 255 });

    const syncSprite = () => {
      const key = `${cur.r | 0},${cur.g | 0},${cur.b | 0}`;
      if (key === spriteKey) return;
      spriteKey = key;
      paintSprite(sctx, cur);
    };

    const blob = (x: number, y: number, radius: number, alpha: number, white = false) => {
      if (alpha <= 0.004 || radius <= 0) return;
      ctx.globalAlpha = Math.min(alpha, 1);
      ctx.drawImage(white ? snow : sprite, x - radius, y - radius, radius * 2, radius * 2);
      ctx.globalAlpha = 1;
    };

    const targetCount = () => {
      const n = w * h * densityFor(modeRef.current) * clamp(intensityRef.current, 0, 1);
      return Math.round(clamp(n, 0, 220));
    };

    const resize = () => {
      // Mobile browsers fire resize every time the address bar slides away.
      // Rebuilding the field for a 60px height change makes the background
      // flicker, so small vertical changes are ignored.
      const nextW = window.innerWidth;
      const nextH = window.innerHeight;
      if (w && nextW === w && Math.abs(nextH - h) < 140) return;
      w = nextW;
      h = nextH;
      dpr = Math.min(window.devicePixelRatio || 1, w > 900 ? 1.5 : 1.25);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      // The element itself stays 100% of the viewport (see the class list),
      // so a skipped resize stretches the field imperceptibly instead of
      // leaving a gap.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const want = targetCount();
      while (particles.length < want) particles.push(spawn(modeRef.current, w, h, true));
      particles.length = Math.min(particles.length, want);
    };

    const onPointer = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    };
    const onLeave = () => { pointer.x = -9999; pointer.y = -9999; };
    const onVisibility = () => {
      // The loop keeps itself alive; restarting it here would stack loops.
      running = !document.hidden;
      last = performance.now();
    };

    const recycle = (p: P) => {
      const m = modeRef.current;
      const next = spawn(m, w, h, false);
      Object.assign(p, next, { o: p.o });
    };

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (!running) return;
      const dt = Math.min(Math.max((now - last) / 1000, 0), 0.05);
      last = now;
      t += dt;

      // Colour cross-fade so the canvas follows the environment.
      cur = mix(cur, hexToRgb(colorRef.current.accent), Math.min(1, dt * 1.6));
      curRay = mix(curRay, hexToRgb(colorRef.current.ray), Math.min(1, dt * 1.6));
      syncSprite();

      // Smoothed pointer.
      pointer.sx += (pointer.x - pointer.sx) * Math.min(1, dt * 6);
      pointer.sy += (pointer.y - pointer.sy) * Math.min(1, dt * 6);

      // Handle a world change: fade the old field out, then swap.
      if (pendingMode.current) {
        let allFaded = true;
        for (const p of particles) {
          p.target = 0;
          if (p.o > 0.02) allFaded = false;
        }
        if (allFaded || particles.length === 0) {
          modeRef.current = pendingMode.current;
          pendingMode.current = null;
          particles = Array.from({ length: targetCount() }, () => spawn(modeRef.current, w, h, true));
        }
      } else {
        const want = targetCount();
        if (particles.length < want) {
          for (let i = particles.length; i < want; i++) particles.push(spawn(modeRef.current, w, h, true));
        } else if (particles.length > want) {
          particles.length = want;
        }
      }

      ctx.clearRect(0, 0, w, h);
      const m = modeRef.current;
      ctx.globalCompositeOperation = m === 'chess' || m === 'letters' || m === 'mist' ? 'source-over' : 'lighter';

      if (m === 'neural') drawNeural(dt);
      else if (m === 'grid') drawGrid(dt);
      else if (m === 'road') drawRoad(dt);
      else drawDrifters(dt);

      ctx.globalCompositeOperation = 'source-over';
    }

    /* ── generic drifting fields ── */
    function drawDrifters(dt: number) {
      const m = modeRef.current;
      for (const p of particles) {
        p.o += (p.target - p.o) * Math.min(1, dt * 4.5);
        const sway = Math.sin(t * 0.6 + p.seed) * (m === 'leaves' ? 26 : m === 'pollen' ? 12 : 6);
        p.x += (p.vx + sway * dt * 6) * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;

        // Gentle pointer parallax.
        if (pointer.sx > -1000) {
          const dx = p.x - pointer.sx;
          const dy = p.y - pointer.sy;
          const d2 = dx * dx + dy * dy;
          if (d2 < 26000) {
            const f = (1 - d2 / 26000) * 34 * dt;
            p.x += (dx / (Math.sqrt(d2) + 0.001)) * f;
            p.y += (dy / (Math.sqrt(d2) + 0.001)) * f;
          }
        }

        if (p.y < -140 || p.y > h + 140 || p.x < -160 || p.x > w + 160) {
          if (!pendingMode.current) recycle(p);
          continue;
        }

        const flicker = m === 'embers' ? 0.6 + 0.4 * Math.sin(t * 5 + p.seed) : 1;
        const alpha = p.a * p.o * flicker * (m === 'mist' ? 1 : 0.9);
        if (alpha <= 0.004) continue;

        if (m === 'letters') {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = css(cur, 0.8);
          ctx.font = `${p.r * 1.6}px "JetBrains Mono", monospace`;
          ctx.translate(p.x, p.y);
          ctx.fillText(p.ch, 0, 0);
          ctx.strokeStyle = css(cur, 0.35);
          ctx.lineWidth = 1;
          ctx.strokeRect(-p.r * 0.5, -p.r * 1.4, p.r * 2, p.r * 2);
          ctx.restore();
          continue;
        }

        if (m === 'chess') {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = css(cur, 0.5);
          ctx.lineWidth = 1;
          ctx.strokeRect(-p.r / 2, -p.r / 2, p.r, p.r);
          if (p.seed % 2 > 1) {
            ctx.fillStyle = css(cur, 0.12);
            ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r);
          }
          ctx.restore();
          continue;
        }

        if (m === 'leaves') {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot + Math.sin(t + p.seed) * 0.6);
          ctx.globalAlpha = alpha;
          ctx.fillStyle = css(cur, 0.75);
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r, p.r * 0.42, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          continue;
        }

        blob(p.x, p.y, p.r * (m === 'mist' ? 1 : 4), alpha, m === 'snow');
      }
    }

    /* ── technology: perspective grid with travelling pulses ── */
    function drawGrid(dt: number) {
      const horizon = h * 0.62;
      const fade = particles.length ? particles[0].o : 1;
      for (const p of particles) p.o += (p.target - p.o) * Math.min(1, dt * 4.5);

      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = 1;
      const rows = 16;
      for (let i = 1; i <= rows; i++) {
        const k = i / rows;
        const y = horizon + Math.pow(k, 2.4) * (h - horizon) * 1.25 + ((t * 26) % ((h - horizon) / rows));
        if (y > h + 4) continue;
        const a = 0.09 * (1 - k * 0.55) * fade;
        ctx.strokeStyle = css(curRay, a);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      const cols = 22;
      for (let i = 0; i <= cols; i++) {
        const x = (i / cols - 0.5) * w * 2.4 + w / 2;
        ctx.strokeStyle = css(curRay, 0.07 * fade);
        ctx.beginPath();
        ctx.moveTo(w / 2 + (x - w / 2) * 0.06, horizon);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      ctx.globalCompositeOperation = 'lighter';
      for (const p of particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;
        const pulse = 0.55 + 0.45 * Math.sin(t * 2 + p.seed);
        blob(p.x, p.y, p.r * 6, p.a * p.o * pulse * 0.7);
      }
    }

    /* ── automation: soft neural graph ── */
    function drawNeural(dt: number) {
      for (const p of particles) {
        p.o += (p.target - p.o) * Math.min(1, dt * 4.5);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        p.x = clamp(p.x, 0, w);
        p.y = clamp(p.y, 0, h);
      }
      const maxD = Math.min(w, h) * 0.22;
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d > maxD) continue;
          const alpha = (1 - d / maxD) * 0.16 * a.o * b.o;
          ctx.strokeStyle = css(cur, alpha);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          // A signal travelling the edge.
          const tt = (t * 0.35 + (i * 7 + j * 13) * 0.081) % 1;
          const px = a.x + (b.x - a.x) * tt;
          const py = a.y + (b.y - a.y) * tt;
          ctx.fillStyle = css(cur, alpha * 3.2);
          ctx.beginPath();
          ctx.arc(px, py, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      for (const p of particles) {
        blob(p.x, p.y, p.r * 7, p.a * p.o * (0.6 + 0.4 * Math.sin(t * 1.6 + p.seed)));
      }
    }

    /* ── driving: light streaks rushing past ── */
    function drawRoad(dt: number) {
      const vpx = w * 0.5;
      const vpy = h * 0.52;
      for (const p of particles) {
        p.o += (p.target - p.o) * Math.min(1, dt * 4.5);
        p.z -= dt * 0.32;
        if (p.z <= 0.04) {
          if (pendingMode.current) continue;
          p.z = 1;
          p.seed = rand(0, 1000);
          p.a = rand(0.2, 0.8);
        }
        const spread = 1 / p.z;
        const ang = p.seed * 0.0063;
        const dirX = Math.cos(ang);
        const dirY = Math.sin(ang) * 0.34;
        const x = vpx + dirX * spread * w * 0.12;
        const y = vpy + dirY * spread * h * 0.12;
        const x2 = vpx + dirX * (spread + 0.5) * w * 0.12;
        const y2 = vpy + dirY * (spread + 0.5) * h * 0.12;
        const alpha = p.a * p.o * clamp(1 - p.z, 0, 1) * 0.85;
        if (alpha < 0.01) continue;
        const grad = ctx.createLinearGradient(x, y, x2, y2);
        grad.addColorStop(0, css(cur, 0));
        grad.addColorStop(1, css(cur, alpha));
        ctx.strokeStyle = grad;
        ctx.lineWidth = clamp(p.r * spread * 0.5, 0.6, 3);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }

    syncSprite();
    resize();
    particles = Array.from({ length: targetCount() }, () => spawn(modeRef.current, w, h, true));
    raf = requestAnimationFrame(frame);

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('pointerleave', onLeave, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 h-full w-full"
      style={{ opacity: 0.9 }}
    />
  );
}
