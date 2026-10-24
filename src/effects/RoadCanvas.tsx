import { useEffect, useRef } from 'react';
import { clamp } from '../lib/utils';
import Envista, { type EnvistaHandle } from './Envista';
import { ENVISTA } from './envistaGeometry';

/**
 * A quiet night drive, filmed side-on: the camera tracks a white Buick
 * Envista along an empty road. This canvas owns the scene's only animation
 * loop — it scrolls the road and also turns the car's wheels, settles its
 * suspension and slides reflections along the paint, so the wheels always
 * turn at exactly the speed the road moves past.
 *
 * Two canvases, one loop: everything that never moves (sky, tarmac, edge
 * lines, the headlight wash) is painted on resize only; each frame clears
 * and redraws just the marks that scroll past.
 *
 * The pointer sets the pace. With reduced motion the scene is painted once.
 */
export default function RoadCanvas({ reduced, label }: { reduced: boolean; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const still = useRef<HTMLCanvasElement>(null);
  const car = useRef<EnvistaHandle>(null);

  useEffect(() => {
    const canvas = ref.current;
    const backdrop = still.current;
    if (!canvas || !backdrop) return;
    const ctx = canvas.getContext('2d')!;
    const bg = backdrop.getContext('2d')!;
    const parent = canvas.parentElement!;

    // The reflector glow, drawn once and stamped for every post.
    const glow = document.createElement('canvas');
    glow.width = glow.height = 64;
    {
      const g = glow.getContext('2d')!;
      const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255,190,120,0.85)');
      grad.addColorStop(1, 'rgba(255,190,120,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
    }

    let w = 0;
    let h = 0;
    let raf = 0;
    let last = performance.now();
    let t = 0;
    let visible = true;
    let pace = 1;
    let paceTarget = 1;
    // Distance travelled, in px at the car's depth. Everything scrolls from this.
    let dist = 0;

    // Where the car sits on the canvas, measured from its SVG on resize.
    let ground = 0;
    let carLeft = 0;
    let carRight = 0;
    let unit = 1; // px per car unit
    let lampX = 0;

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
      w = rect.width;
      h = rect.height;
      for (const [c, x] of [
        [canvas, ctx],
        [backdrop, bg],
      ] as const) {
        c.width = Math.floor(w * dpr);
        c.height = Math.floor(h * dpr);
        c.style.width = `${w}px`;
        c.style.height = `${h}px`;
        x.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      const svg = car.current?.svg?.getBoundingClientRect();
      if (svg && svg.width) {
        unit = svg.width / ENVISTA.width;
        ground = svg.top - rect.top + ENVISTA.ground * unit;
        carLeft = svg.left - rect.left + 20 * unit;
        carRight = svg.left - rect.left + 627 * unit;
        lampX = svg.left - rect.left + 618 * unit;
      } else {
        unit = (w * 0.6) / ENVISTA.width;
        ground = h * 0.84;
        carLeft = w * 0.2;
        carRight = w * 0.8;
        lampX = carRight;
      }
      paintStill();
      paint();
    };

    const onMove = (e: PointerEvent) => {
      const rect = parent.getBoundingClientRect();
      paceTarget = 0.6 + clamp((e.clientX - rect.left) / rect.width, 0, 1) * 0.9;
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
      if (visible && !reduced) start();
      else stop();
    }, { threshold: 0.05 });

    /** Repeating marks scrolling left at `factor` × the car's speed. */
    const scroll = (spacing: number, factor: number, offset = 0) => {
      const shift = (dist * factor + offset) % spacing;
      return (i: number) => i * spacing - shift;
    };

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      // Clamped: a frame timestamp can predate the last reset, and a
      // negative delta would run the scene backwards.
      const dt = Math.min(Math.max((now - last) / 1000, 0), 0.05);
      last = now;
      t += dt;
      pace += (paceTarget - pace) * Math.min(1, dt * 1.6);
      // Roughly one car length per second at the default pace.
      dist += pace * 600 * unit * dt;
      paint();
    }

    // Lane positions, all measured from where the tyres meet the road.
    const lanes = () => {
      const farEdge = ground - h * 0.14;
      return { farEdge, horizon: farEdge - h * 0.04, centre: ground - h * 0.07, nearEdge: ground + h * 0.045 };
    };

    function paintStill() {
      const { farEdge, horizon, nearEdge } = lanes();
      bg.clearRect(0, 0, w, h);

      // Glow along the horizon.
      const sky = bg.createLinearGradient(0, horizon - h * 0.3, 0, farEdge);
      sky.addColorStop(0, 'rgba(0,0,0,0)');
      sky.addColorStop(0.75, 'rgba(110,180,255,0.12)');
      sky.addColorStop(1, 'rgba(150,205,255,0.2)');
      bg.fillStyle = sky;
      bg.fillRect(0, horizon - h * 0.3, w, farEdge - horizon + h * 0.3);

      // Tarmac, darker toward the camera.
      const road = bg.createLinearGradient(0, farEdge, 0, h);
      road.addColorStop(0, 'rgba(22,27,46,0.95)');
      road.addColorStop(0.5, 'rgba(10,13,24,0.98)');
      road.addColorStop(1, 'rgba(5,7,13,1)');
      bg.fillStyle = road;
      bg.fillRect(0, farEdge, w, h - farEdge);

      bg.globalCompositeOperation = 'lighter';
      // Far and near edge lines.
      bg.fillStyle = 'rgba(120,215,255,0.32)';
      bg.fillRect(0, farEdge, w, 1.5);
      bg.fillStyle = 'rgba(120,215,255,0.22)';
      bg.fillRect(0, nearEdge, w, 2);

      // Headlight wash on the road ahead.
      const beam = bg.createLinearGradient(lampX, 0, lampX + w * 0.4, 0);
      beam.addColorStop(0, 'rgba(225,240,255,0.2)');
      beam.addColorStop(1, 'rgba(225,240,255,0)');
      bg.fillStyle = beam;
      bg.beginPath();
      bg.moveTo(lampX, ground - 92 * unit);
      bg.lineTo(lampX + w * 0.45, ground - 40 * unit);
      bg.lineTo(lampX + w * 0.45, ground + 8 * unit);
      bg.lineTo(lampX, ground - 60 * unit);
      bg.closePath();
      bg.fill();
      bg.globalCompositeOperation = 'source-over';
    }

    function paint() {
      const { farEdge, centre, nearEdge } = lanes();
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';

      // Reflective posts on the far shoulder — slower, they are further away.
      const postGap = Math.max(w * 0.42, 180);
      const post = scroll(postGap, 0.62, postGap * 0.3);
      let reflect = -1;
      for (let i = 0; i < Math.ceil(w / postGap) + 2; i++) {
        const x = post(i);
        const top = farEdge - h * 0.075;
        ctx.fillStyle = 'rgba(160,180,220,0.18)';
        ctx.fillRect(x - 1, top, 2, farEdge - top);
        ctx.drawImage(glow, x - 16, top + 3 - 16, 32, 32);
        if (x > carLeft && x < carRight) reflect = (x - carLeft) / (carRight - carLeft);
      }

      // Centre dashes, one lane over.
      const dashGap = Math.max(w * 0.22, 110);
      const dashW = dashGap * 0.45;
      const dash = scroll(dashGap, 0.86);
      ctx.fillStyle = 'rgba(230,240,255,0.42)';
      for (let i = 0; i < Math.ceil(w / dashGap) + 2; i++) ctx.fillRect(dash(i), centre, dashW, Math.max(2, h * 0.007));

      // Grain in the car's own lane: moves at exactly the car's speed, so it
      // is what the tyres visibly roll over.
      const grainGap = 22 * unit;
      const grain = scroll(grainGap, 1);
      ctx.fillStyle = 'rgba(170,190,230,0.07)';
      for (let i = 0; i < Math.ceil(w / grainGap) + 2; i++) {
        const x = grain(i);
        ctx.fillRect(x, ground + 2, 7 * unit, 1);
        ctx.fillRect(x + 11 * unit, ground + 7 * unit, 4 * unit, 1);
      }

      // Rumble strip on the near edge — closest to the camera, so fastest.
      const tickGap = Math.max(18 * unit, 10);
      const tick = scroll(tickGap, 1.12);
      ctx.fillStyle = 'rgba(200,230,255,0.16)';
      for (let i = 0; i < Math.ceil(w / tickGap) + 2; i++) ctx.fillRect(tick(i), nearEdge + 4, tickGap * 0.4, 3);

      ctx.globalCompositeOperation = 'source-over';

      // The car: wheels roll the distance travelled; the body floats on its springs.
      const angle = reduced ? 0 : dist / (ENVISTA.wheelR * unit);
      const bob = reduced ? 0 : Math.sin(t * 2.3) * 0.45 + Math.sin(t * 7.1) * 0.18;
      car.current?.pose(angle, bob, reflect);
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    io.observe(parent);
    if (!reduced) {
      window.addEventListener('pointermove', onMove, { passive: true });
      start();
    }

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
    };
  }, [reduced]);

  return (
    <>
      <canvas ref={still} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      <canvas ref={ref} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      <div className="absolute bottom-[12%] left-1/2 w-[84%] -translate-x-1/2 sm:bottom-[13%] sm:w-[60%]">
        <Envista ref={car} label={label} />
      </div>
    </>
  );
}

