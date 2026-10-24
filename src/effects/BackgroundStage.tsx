import { useEffect, useRef, useState, type CSSProperties, type ReactElement } from 'react';
import type { ScapeKey, Theme } from '../data/worlds';
import { useDevice, useEnv } from '../state/hooks';
import { mulberry32 } from '../lib/utils';
import {
  CircuitScape,
  CityScape,
  HorizonScape,
  MoonScape,
  MountainScape,
  NatureScape,
  NorthScape,
  TreeScape,
} from './Silhouettes';

const SCAPES: Record<ScapeKey, (props?: { align?: string; lite?: boolean }) => ReactElement> = {
  tree: TreeScape,
  moon: MoonScape,
  north: NorthScape,
  mountain: MountainScape,
  city: CityScape,
  nature: NatureScape,
  circuit: CircuitScape,
  horizon: HorizonScape,
};

/** `#rrggbb` + alpha (0–1) → `#rrggbbaa`. */
const alpha = (hex: string, a: number) => `${hex}${Math.round(a * 255).toString(16).padStart(2, '0')}`;

interface Layer {
  key: number;
  theme: Theme;
  scape: ScapeKey;
}

/**
 * The world behind the page.
 *
 * Performance notes — this layer used to cost a full frame of work on every
 * frame, even with nobody touching the page. Now:
 *  - The starfield is painted to canvas once (and on real resizes), never per frame.
 *  - Its parallax is a scroll-driven CSS animation, so it costs nothing at
 *    rest and runs off the main thread while scrolling.
 *  - A chapter change mounts one new layer that fades in with a single opacity
 *    animation; the gradients are painted once rather than every frame.
 */
export default function BackgroundStage() {
  const { theme, scape } = useEnv();
  const { compact, finePointer, reducedMotion } = useDevice();

  // Keep the outgoing layer underneath while the incoming one fades in.
  const [layers, setLayers] = useState<Layer[]>([{ key: 0, theme, scape }]);
  const top = layers[layers.length - 1];
  if (top.theme !== theme || top.scape !== scape) {
    setLayers([top, { key: top.key + 1, theme, scape }]);
  }

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#03040a]">
      {layers.map((l, i) => (
        <Atmosphere
          key={l.key}
          layer={l}
          fresh={i > 0}
          lite={compact}
          // Once the new world has faded in, the old one is fully covered — drop it.
          onSettled={i > 0 ? () => setLayers((ls) => (ls[ls.length - 1].key === l.key ? [l] : ls)) : undefined}
        />
      ))}
      <Starfield compact={compact} />
      {finePointer && !reducedMotion && <Spotlight color={theme.accent} />}
      {/* Depth: a vignette that keeps the edges in deep space. */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(110% 80% at 50% 40%, transparent 35%, rgba(1,2,6,0.5) 72%, rgba(1,2,6,0.85) 100%)' }}
      />
    </div>
  );
}

function Atmosphere({ layer, fresh, lite, onSettled }: { layer: Layer; fresh: boolean; lite: boolean; onSettled?: () => void }) {
  const { theme, scape } = layer;
  const Scape = SCAPES[scape];
  return (
    <div
      className="absolute inset-0"
      style={{
        background: [
          `radial-gradient(80% 55% at 14% 6%, ${alpha(theme.ray, 0.6)} 0%, transparent 70%)`,
          `radial-gradient(55% 45% at 92% 88%, ${alpha(theme.accent, 0.13)} 0%, transparent 70%)`,
          `radial-gradient(50% 40% at 70% 18%, ${alpha('#5a3fd0', 0.14)} 0%, transparent 70%)`,
          `radial-gradient(130% 90% at 50% 0%, ${theme.b} 0%, ${theme.a} 42%, ${theme.void} 82%)`,
        ].join(', '),
        animation: fresh ? 'fade-in 1100ms var(--ease-out-expo) both' : undefined,
        willChange: fresh ? 'opacity' : undefined,
      }}
      onAnimationEnd={(e) => e.target === e.currentTarget && onSettled?.()}
    >
      {/* The art reads its palette from these, scoped to this layer only. */}
      <div
        className="absolute inset-0 translate-y-[4%] scale-[1.06] opacity-90"
        style={
          {
            '--env-accent': theme.accent,
            '--env-ray': theme.ray,
            '--env-a': theme.a,
            '--env-b': theme.b,
            '--env-void': theme.void,
          } as CSSProperties
        }
      >
        <Scape lite={lite} />
      </div>
    </div>
  );
}

/**
 * Two canvases of stars, painted once. Depth comes from moving them at
 * different speeds against the page scroll (see `.stars-*` in the CSS below).
 */
function Starfield({ compact }: { compact: boolean }) {
  const far = useRef<HTMLCanvasElement>(null);
  const near = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let w = 0;
    let h = 0;
    const paint = () => {
      const nw = window.innerWidth;
      const nh = window.innerHeight;
      // Phone address bars resize the viewport constantly; only repaint for
      // a real change.
      if (w && nw === w && Math.abs(nh - h) < 160) return;
      w = nw;
      h = nh;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const draw = (canvas: HTMLCanvasElement | null, seed: number, count: number, bright: boolean) => {
        if (!canvas) return;
        // Taller than the viewport so the parallax never runs out of sky.
        const ch = h * 1.35;
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(ch * dpr);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, ch);
        const rnd = mulberry32(seed);
        for (let i = 0; i < count; i++) {
          const x = rnd() * w;
          const y = rnd() * ch;
          const r = bright ? 0.6 + rnd() ** 3 * 1.6 : 0.3 + rnd() * 0.7;
          const tint = rnd();
          const color = tint > 0.93 ? '255,178,120' : tint > 0.78 ? '140,225,255' : tint > 0.68 ? '185,165,255' : '225,235,255';
          const a = bright ? 0.45 + rnd() * 0.5 : 0.15 + rnd() * 0.4;
          if (bright && r > 1.3) {
            const g = ctx.createRadialGradient(x, y, 0, x, y, r * 5);
            g.addColorStop(0, `rgba(${color},${a * 0.5})`);
            g.addColorStop(1, `rgba(${color},0)`);
            ctx.fillStyle = g;
            ctx.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);
          }
          ctx.fillStyle = `rgba(${color},${a})`;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      };
      const area = (w * h) / (1440 * 900);
      draw(far.current, 11, Math.round((compact ? 260 : 420) * Math.min(area, 1.6)), false);
      draw(near.current, 29, Math.round((compact ? 50 : 90) * Math.min(area, 1.6)), true);
    };

    paint();
    let t = 0;
    const onResize = () => {
      window.clearTimeout(t);
      t = window.setTimeout(paint, 200);
    };
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', onResize);
    };
  }, [compact]);

  return (
    <>
      <canvas ref={far} className="stars stars-far absolute top-0 left-0 h-[135vh] w-full" />
      <canvas ref={near} className="stars stars-near absolute top-0 left-0 h-[135vh] w-full" />
    </>
  );
}

/** A soft light that follows the pointer — desktop only, one transform per frame. */
function Spotlight({ color }: { color: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    let x = 0;
    let y = 0;
    const apply = () => {
      raf = 0;
      ref.current?.style.setProperty('transform', `translate3d(${x - 450}px, ${y - 450}px, 0)`);
    };
    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
      if (ref.current) ref.current.style.opacity = '1';
    };
    const onLeave = () => {
      if (ref.current) ref.current.style.opacity = '0';
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, []);
  return (
    <div
      ref={ref}
      className="absolute top-0 left-0 h-[900px] w-[900px] rounded-full opacity-0 transition-opacity duration-700"
      style={{ background: `radial-gradient(circle, ${alpha(color, 0.09)} 0%, ${alpha(color, 0.03)} 40%, transparent 70%)`, willChange: 'transform' }}
    />
  );
}
