import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import Logo, { BAR, MARK } from '../ui/Logo';
import { markIntroSeen } from '../../lib/intro';
import { clipFor, compose, pathFor, PORTRAIT_SIZES, type Composition, type Rect } from '../../lib/duality';
import { INTRO_ART } from '../../data/introArt';
import { useDevice } from '../../state/hooks';
import { cn, mulberry32 } from '../../lib/utils';

/*
 * The intro: AJ, twice. The same portrait, lit white on the left and red on
 * the right, back to back across an S-shaped boundary — an original take on
 * yin and yang, made from AJ's own artwork.
 *
 * The original glitch sequence is what builds it:
 *   darkness → a white signal from the left and a red one from the right
 *   meet in the middle → each portrait glitches into view, slices briefly
 *   swapping colour (it is the same person) → light runs down the boundary
 *   and the orbit closes → the chess lineup lights outward from the seam →
 *   the AJ mark glitches in and draws itself → DIGITAL WORLD decodes.
 *
 * Entry is a press-and-hold anywhere on the composition (mouse, touch, pen
 * — one Pointer Events path — or the space bar / Enter key held down). The
 * light gathers while it is held: a white arc and a red arc close around
 * the mark, the boundary charges, both portraits brighten. Let go early and
 * it all drains back. Hold to the end and the two lights converge on the
 * mark, a circle opens from it onto the home page, and the mark itself
 * flies to its place in the home page's emblem. "Skip intro" and Escape
 * take the same way in, at once. There is no auto-exit: the intro waits.
 *
 * Nearly all of it is CSS, animating transform and opacity, and once the
 * sequence has played nothing moves but the breathing hint. Scripted
 * animation is limited to easing the boundary (it stops once settled) and
 * the exit, whose geometry depends on the screen (Web Animations — one
 * call each, nothing looping). Layout comes from src/lib/duality.ts.
 * Reduced motion shows the finished composition, still; the hold works the
 * same, its ring fills, and the exit is immediate.
 */

/** How long to hold. Long enough that a stray touch never enters. */
export const HOLD_MS = 1150;
/** A release sooner than this is a tap: it lights the side that was tapped. */
const TAP_MS = 220;
const GLITCH_MS = 1700;
/** When the sequence has settled and the intro is waiting. */
const READY_MS = 3600;
const LEAVE_MS = 1250;

const WORD = 'DIGITAL WORLD';
const GLYPHS = '01<>/\\[]{}#*+=';

/** Short shards of light: white on the left, red on the right. */
const FRAGMENTS = (() => {
  const rnd = mulberry32(7);
  return Array.from({ length: 14 }, () => {
    const left = 6 + rnd() * 84;
    return {
      top: `${14 + rnd() * 70}%`,
      left: `${left}%`,
      width: `${20 + rnd() * 120}px`,
      delay: `${380 + rnd() * 700}ms`,
      color: left < 50 ? '#f4f6fb' : '#ff3444',
    };
  });
})();

/** Horizontal glitch slices over each portrait; `swap` shows the other colour. */
const SLICES = [
  { top: 8, bottom: 78, swap: false, k: 'a' },
  { top: 27, bottom: 61, swap: true, k: 'b' },
  { top: 44, bottom: 47, swap: false, k: 'c' },
  { top: 58, bottom: 30, swap: true, k: 'a' },
  { top: 74, bottom: 14, swap: false, k: 'b' },
];

/** Types WORD in through random glyphs; `start` null shows it at once. */
function Decode({ start }: { start: number | null }) {
  const [text, setText] = useState(() => (start === null ? WORD : WORD.replace(/\S/g, ' ')));
  useEffect(() => {
    if (start === null) return;
    let frame = 0;
    let interval = 0;
    const begin = window.setTimeout(() => {
      interval = window.setInterval(() => {
        frame += 1;
        const settled = Math.floor(frame / 1.4);
        setText(
          WORD.split('')
            .map((ch, i) => (ch === ' ' || i < settled ? ch : GLYPHS[(i * 7 + frame * 3) % GLYPHS.length]))
            .join(''),
        );
        if (settled >= WORD.length) window.clearInterval(interval);
      }, 38);
    }, start);
    return () => {
      window.clearTimeout(begin);
      window.clearInterval(interval);
    };
  }, [start]);
  return <>{text}</>;
}

/** A flat silhouette of the mark, used for the split-colour glitch copies. */
function MarkGhost({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true" className="overflow-visible">
      <g fill="none" stroke="currentColor" strokeLinejoin="miter">
        <path d="M30 6 H90 L114 30 V90 L90 114 H30 L6 90 V30 Z" strokeWidth="1.4" />
        <path d={MARK} strokeWidth="9" />
        <path d={BAR} strokeWidth="7" />
      </g>
    </svg>
  );
}

const box = (r: Rect): CSSProperties => ({ left: r.x, top: r.y, width: r.w, height: r.h });
const src = (name: string, type: 'avif' | 'webp') =>
  INTRO_ART[name]?.widths.map((w) => `${import.meta.env.BASE_URL}intro/${name}-${w}.${type} ${w}w`).join(', ');

/** One of AJ's portraits. Decoded once per file however many times it is drawn. */
function Portrait({ name, className, style }: { name: 'white' | 'red'; className?: string; style?: CSSProperties }) {
  const art = INTRO_ART[name];
  if (!art) return null;
  const largest = art.widths[art.widths.length - 1];
  return (
    <picture>
      <source type="image/avif" srcSet={src(name, 'avif')} sizes={PORTRAIT_SIZES} />
      <source type="image/webp" srcSet={src(name, 'webp')} sizes={PORTRAIT_SIZES} />
      <img
        src={`${import.meta.env.BASE_URL}intro/${name}-${largest}.webp`}
        alt=""
        draggable={false}
        decoding="async"
        className={cn('duo-img absolute inset-0 h-full w-full select-none', className)}
        style={style}
      />
    </picture>
  );
}

/** One half: a portrait, its light, and — while it arrives — its glitch. */
function Side({ c, side, glitching, sideRef }: { c: Composition; side: 'white' | 'red'; glitching: boolean; sideRef: React.Ref<HTMLDivElement> }) {
  const r = c[side];
  const other = side === 'white' ? 'red' : 'white';
  const flip = side === 'red';
  return (
    <div ref={sideRef} className={`duo-side duo-${side}`} aria-hidden="true">
      <div className="duo-glow absolute" style={{ left: r.x + r.w * (flip ? 0.5 : 0.18), top: r.y + r.h * 0.12, width: r.w * 0.32, height: r.h * 0.6 }} />
      <div className={cn('duo-portrait absolute', flip && 'duo-flip')} style={box(r)}>
        <Portrait name={side} className="duo-reveal" />
        {/* The same portrait, lit brighter — painted once, then only faded in. */}
        <div className="duo-lit absolute inset-0">
          <Portrait name={side} className="duo-lit-img" />
        </div>
        {glitching &&
          SLICES.map((s, i) => (
            <div key={i} className={`duo-slice duo-slice-${s.k} absolute inset-0`} style={{ clipPath: `inset(${s.top}% 0 ${s.bottom}% 0)`, animationDelay: `${(side === 'red' ? 880 : 760) + i * 40}ms` }}>
              {/* Same drawing, same framing: a swapped slice lines up exactly. */}
              <Portrait name={s.swap ? other : side} />
            </div>
          ))}
      </div>
    </div>
  );
}

function Chess({ c, onPlay }: { c: Composition; onPlay: () => void }) {
  const art = INTRO_ART.chess;
  if (!art) return null;
  const sizes = `${Math.round(c.chess.w)}px`;
  return (
    <button type="button" className="duo-chess absolute" style={box(c.chess)} onPointerEnter={(e) => e.pointerType === 'mouse' && onPlay()} onClick={onPlay} aria-label="Run a light along the chess lineup">
      <picture>
        <source type="image/avif" srcSet={src('chess', 'avif')} sizes={sizes} />
        <source type="image/webp" srcSet={src('chess', 'webp')} sizes={sizes} />
        <img src={`${import.meta.env.BASE_URL}intro/chess-${art.widths[0]}.webp`} alt="" draggable={false} decoding="async" fetchPriority="low" className="absolute inset-0 h-full w-full select-none" />
      </picture>
      {/* Covers part from the seam where white becomes red. */}
      <span aria-hidden="true" className="duo-cover duo-cover-l" style={{ width: `${0.4489 * 100}%` }} />
      <span aria-hidden="true" className="duo-cover duo-cover-r" style={{ left: `${0.4489 * 100}%` }} />
      <span aria-hidden="true" className="duo-sweep" />
    </button>
  );
}

type Hint = 'hold' | 'almost';

interface IntroProps {
  /** The sequence has finished, or a hold has begun: time to get the page ready underneath. */
  onReady?: () => void;
  /** The way in has begun. */
  onLeaving?: () => void;
  onDone: () => void;
}

export default function Intro({ onReady, onLeaving, onDone }: IntroProps) {
  const { reducedMotion, finePointer } = useDevice();
  const [leaving, setLeaving] = useState(false);
  const [hint, setHint] = useState<Hint>('hold');
  const [glitching, setGlitching] = useState(!reducedMotion);
  const [view, setView] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const c = useMemo(() => compose(view.w, view.h), [view]);

  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLDivElement>(null);
  const edge = useRef<HTMLDivElement>(null);
  const white = useRef<HTMLDivElement>(null);
  const red = useRef<HTMLDivElement>(null);
  const lines = useRef<SVGGElement>(null);
  const charge = useRef<SVGPathElement>(null);
  const leavingRef = useRef(false);
  const sway = useRef({ cur: 0, target: 0, raf: 0 });
  const geo = useRef({ c, view });
  /** The hold in progress, if any: who is holding, since when, and its timers. */
  const hold = useRef<{ who: number | 'key' | null; t0: number; timers: number[] }>({ who: null, t0: 0, timers: [] });

  /* The boundary is drawn imperatively so re-renders never reset it. */
  const draw = useCallback((s: number) => {
    const { c: comp, view: v } = geo.current;
    white.current?.style.setProperty('clip-path', clipFor(comp, 'white', v.w, v.h, s));
    red.current?.style.setProperty('clip-path', clipFor(comp, 'red', v.w, v.h, s));
    const d = pathFor(comp, s);
    lines.current?.querySelectorAll('path').forEach((p) => p.setAttribute('d', d));
    charge.current?.setAttribute('d', d);
  }, []);
  useLayoutEffect(() => {
    geo.current = { c, view };
    draw(sway.current.cur);
  }, [c, view, draw]);

  // Eases the boundary towards its target, then stops.
  const steer = useCallback(
    (target: number) => {
      const s = sway.current;
      s.target = target;
      if (s.raf || reducedMotion) {
        if (reducedMotion) draw((s.cur = target));
        return;
      }
      const tick = () => {
        s.cur += (s.target - s.cur) * 0.14;
        if (Math.abs(s.target - s.cur) < 0.002) s.cur = s.target;
        draw(s.cur);
        s.raf = s.cur === s.target ? 0 : requestAnimationFrame(tick);
      };
      s.raf = requestAnimationFrame(tick);
    },
    [draw, reducedMotion],
  );

  /* ── Leaving: one way out, whichever way it was asked for. ── */
  const finish = useCallback(() => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    hold.current.timers.forEach(window.clearTimeout);
    hold.current = { who: null, t0: 0, timers: [] };
    setLeaving(true);
  }, []);

  /* ── Holding ── */
  const release = useCallback(() => {
    const h = hold.current;
    if (h.who === null || leavingRef.current) return;
    h.timers.forEach(window.clearTimeout);
    hold.current = { who: null, t0: 0, timers: [] };
    root.current?.classList.remove('is-holding');
    setHint('hold');
  }, []);

  const press = useCallback(
    (who: number | 'key') => {
      if (leavingRef.current || hold.current.who !== null) return;
      onReady?.();
      root.current?.classList.add('is-holding');
      hold.current = {
        who,
        t0: performance.now(),
        timers: [window.setTimeout(() => setHint('almost'), HOLD_MS * 0.8), window.setTimeout(finish, HOLD_MS)],
      };
    },
    [finish, onReady],
  );

  /** A side answers a tap: it flares, its partner answers, the boundary leans. */
  const pulse = useCallback(
    (side: 'white' | 'red') => {
      const el = root.current;
      if (!el || reducedMotion) return;
      el.classList.remove('pulse-white', 'pulse-red');
      void el.offsetWidth; // restart the CSS animation
      el.classList.add(`pulse-${side}`);
      steer(side === 'white' ? 0.9 : -0.9);
      window.setTimeout(() => {
        if (!el.dataset.side) steer(0);
      }, 1100);
    },
    [steer, reducedMotion],
  );

  const onDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (!e.isPrimary || e.button !== 0) return;
      press(e.pointerId);
    },
    [press],
  );
  const onUp = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      const h = hold.current;
      if (h.who !== e.pointerId) return;
      const tap = performance.now() - h.t0 < TAP_MS;
      release();
      if (!tap) return;
      const { c: comp } = geo.current;
      pulse((comp.stacked ? e.clientY < comp.mark.y : e.clientX < comp.mark.x) ? 'white' : 'red');
    },
    [release, pulse],
  );
  const onLost = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (hold.current.who === e.pointerId) release();
    },
    [release],
  );

  const playChess = useCallback(() => {
    const el = root.current;
    if (!el) return;
    el.classList.remove('chess-play');
    void el.offsetWidth;
    el.classList.add('chess-play');
  }, []);

  // Desktop: the side under the pointer leans in, gently.
  const onMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== 'mouse') return;
      const el = e.currentTarget;
      const { view: v, c: comp } = geo.current;
      const n = comp.stacked ? (e.clientY / v.h - 0.5) * 2 : (e.clientX / v.w - 0.5) * 2;
      const side = n < -0.2 ? 'white' : n > 0.2 ? 'red' : '';
      if (el.dataset.side !== side) el.dataset.side = side;
      steer(Math.max(-1, Math.min(1, -n)) * 0.8);
    },
    [steer],
  );
  const onLeave = useCallback(() => {
    if (root.current) root.current.dataset.side = '';
    steer(0);
  }, [steer]);

  useEffect(() => {
    markIntroSeen();
    const onResize = () => setView({ w: window.innerWidth, h: window.innerHeight });
    // Keyboard: hold Space or Enter to enter (on the page or the hold area —
    // the skip and chess buttons keep their own keys); Escape skips.
    const isOtherButton = (t: EventTarget | null) => t instanceof HTMLElement && !!t.closest('button:not(.duo-hold)');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        finish();
      } else if ((e.key === ' ' || e.key === 'Enter') && !isOtherButton(e.target)) {
        e.preventDefault();
        if (!e.repeat) press('key');
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if ((e.key === ' ' || e.key === 'Enter') && hold.current.who === 'key') {
        e.preventDefault();
        release();
      }
    };
    // Switching away mid-hold lets go.
    const letGo = () => release();
    const unglitch = window.setTimeout(() => setGlitching(false), GLITCH_MS);
    // Once the sequence has played, the page can render quietly underneath.
    const ready = window.setTimeout(() => onReady?.(), reducedMotion ? 0 : READY_MS);
    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', letGo);
    document.addEventListener('visibilitychange', letGo);
    const s = sway.current;
    const h = hold;
    return () => {
      window.clearTimeout(unglitch);
      window.clearTimeout(ready);
      h.current.timers.forEach(window.clearTimeout);
      cancelAnimationFrame(s.raf);
      s.raf = 0;
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', letGo);
      document.removeEventListener('visibilitychange', letGo);
    };
  }, [finish, press, release, onReady, reducedMotion]);

  /*
   * The way in. The page underneath starts rendering at once; the two lights
   * converge on the mark (CSS); a circle opens from the mark onto the home
   * page while the mark flies to the home page's emblem (Web Animations,
   * since both depend on where things are on this screen).
   */
  useEffect(() => {
    if (!leaving) return;
    onLeaving?.();
    if (reducedMotion) {
      onDone();
      return;
    }
    const doc = document.documentElement;
    const { c: comp, view: v } = geo.current;
    const cx = comp.mark.x;
    const cy = comp.mark.y;
    const far = Math.hypot(Math.max(cx, v.w - cx), Math.max(cy, v.h - cy)) + 40;
    const ease = 'cubic-bezier(0.55, 0, 0.3, 1)';
    const anims: Animation[] = [];
    const el = root.current;
    if (el) {
      // One value drives both the opening (a mask on the stage) and its
      // glowing edge, so the two can never drift apart.
      el.style.setProperty('--ix', `${cx}px`);
      el.style.setProperty('--iy', `${cy}px`);
      anims.push(el.animate([{ '--irisn': 0 }, { '--irisn': far }], { duration: 950, delay: 180, easing: ease, fill: 'both' }));
    }
    if (edge.current) {
      anims.push(edge.current.animate([{ opacity: 1 }, { opacity: 0.15 }], { duration: 950, delay: 180, easing: ease, fill: 'both' }));
    }
    let frame = 0;
    const m = mark.current;
    if (m) {
      doc.classList.add('mark-in-flight');
      // Measure where the mark lands once the home page has laid out.
      frame = requestAnimationFrame(() => {
        const target = document.querySelector('[data-hero-mark]')?.getBoundingClientRect();
        const size = Math.round(Math.max(64, comp.mark.size));
        const to =
          target && target.width > 0 && target.bottom > 0 && target.top < v.h
            ? `translate(${target.left + target.width / 2 - cx}px, ${target.top + target.height / 2 - cy}px) scale(${target.width / size})`
            : 'scale(1.5)';
        const fly = m.animate(
          [
            { transform: 'scale(1.1)', opacity: 1 },
            { transform: 'scale(1.18)', opacity: 1, offset: 0.2 },
            { transform: to, opacity: 1, offset: 0.88 },
            { transform: to, opacity: target ? 1 : 0 },
          ],
          { duration: 1100, delay: 60, easing: 'cubic-bezier(0.65, 0, 0.25, 1)', fill: 'both' },
        );
        fly.onfinish = () => doc.classList.remove('mark-in-flight');
        anims.push(fly);
      });
    }
    const t = window.setTimeout(onDone, LEAVE_MS);
    return () => {
      window.clearTimeout(t);
      cancelAnimationFrame(frame);
      anims.forEach((a) => a.cancel());
      doc.classList.remove('mark-in-flight');
    };
  }, [leaving, onLeaving, onDone, reducedMotion]);

  const signalY = c.stacked ? c.mark.y : c.white.y + c.white.h * 0.43;
  const markSize = Math.round(Math.max(64, c.mark.size));
  const ringSize = Math.round(markSize * 1.42);
  const interactive = !reducedMotion;
  // The boundary line fades out at its ends, and before it reaches the wordmark.
  const lineMask = c.stacked
    ? 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)'
    : `linear-gradient(180deg, transparent ${c.word.y + 30}px, #000 ${c.word.y + 110}px, #000 calc(100% - 40px), transparent)`;
  // The line SVGs cover only the band the boundary can sway through, not the screen.
  const band = useMemo(() => {
    const pts = [-1, 0, 1].flatMap((s) => c.boundary(s));
    const pad = 8;
    const x0 = c.stacked ? 0 : Math.min(...pts.map((p) => p[0])) - pad;
    const x1 = c.stacked ? view.w : Math.max(...pts.map((p) => p[0])) + pad;
    const y0 = c.stacked ? Math.min(...pts.map((p) => p[1])) - pad : 0;
    const y1 = c.stacked ? Math.max(...pts.map((p) => p[1])) + pad : view.h;
    return { left: x0, top: y0, width: x1 - x0, height: y1 - y0, viewBox: `${x0} ${y0} ${x1 - x0} ${y1 - y0}` };
  }, [c, view]);
  const lineStyle = { maskImage: lineMask, WebkitMaskImage: lineMask, left: band.left, top: band.top, width: band.width, height: band.height };

  return (
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to AJ's Digital World"
      className={cn('intro', leaving && 'is-leaving', c.stacked && 'is-stacked', reducedMotion && 'is-still')}
      style={{ ['--hold' as string]: `${HOLD_MS}ms` }}
      onPointerMove={interactive && finePointer ? onMove : undefined}
      onPointerLeave={interactive && finePointer ? onLeave : undefined}
    >
      {/* First in tab order: leaving is always one keypress away. */}
      <button
        type="button"
        onClick={finish}
        className="intro-skip label absolute right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-20 min-h-11 rounded-full border border-white/15 px-5 py-2.5 text-[var(--color-ink-dim)] transition-colors hover:border-white/35 hover:text-white sm:right-8 sm:bottom-8"
      >
        Skip intro
      </button>

      {/*
        The hold area: the whole composition. A real button, so it is
        focusable and announced; pointer, touch and pen share one path. It
        sits beneath the stage, which lets pointer events through.
      */}
      <button
        type="button"
        className="duo-hold"
        aria-label="Hold to enter Digital World — press and hold here, or hold the space bar"
        aria-describedby="duo-hold-hint"
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerCancel={onLost}
        onPointerLeave={onLost}
        onContextMenu={(e) => e.preventDefault()}
      />


      {/* Everything the circle opens through on the way in. */}
      <div ref={stage} className="duo-stage">
        {/* The orbit: white arc on the left, red on the right. */}
        <div aria-hidden="true" className="duo-ring absolute" style={{ left: c.ring.x - c.ring.r, top: c.ring.y - c.ring.r, width: c.ring.r * 2, height: c.ring.r * 2 }}>
          <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full overflow-visible">
            <defs>
              <linearGradient id="duo-ring" x1={c.stacked ? 0.5 : 0} y1={c.stacked ? 0 : 0.5} x2={c.stacked ? 0.5 : 1} y2={c.stacked ? 1 : 0.5}>
                <stop offset="0" stopColor="#f4f6fb" />
                <stop offset="0.44" stopColor="#f4f6fb" stopOpacity="0.15" />
                <stop offset="0.56" stopColor="#ff3444" stopOpacity="0.15" />
                <stop offset="1" stopColor="#ff3444" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="99.5" fill="none" stroke="url(#duo-ring)" strokeOpacity="0.55" strokeWidth="0.35" vectorEffect="non-scaling-stroke" />
          </svg>
          <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full overflow-visible">
            <circle cx="100" cy="100" r="102.5" fill="none" stroke="url(#duo-ring)" strokeOpacity="0.4" strokeWidth="2" strokeDasharray="0.6 9.6" />
          </svg>
        </div>

        <Side c={c} side="white" glitching={glitching} sideRef={white} />
        <Side c={c} side="red" glitching={glitching} sideRef={red} />

        <div className="intro-lines" aria-hidden="true" />
        <div className="intro-scan" aria-hidden="true" />

        {/* The boundary: a white edge on the white side, a red edge on the red. */}
        <svg aria-hidden="true" viewBox={band.viewBox} className="duo-line pointer-events-none absolute overflow-visible" style={lineStyle}>
          <defs>
            <linearGradient id="duo-run" x1="0" y1="0" x2={c.stacked ? 1 : 0} y2={c.stacked ? 0 : 1}>
              <stop offset="0" stopColor="#fff" />
              <stop offset="1" stopColor="#ff4a55" />
            </linearGradient>
          </defs>
          <g ref={lines} fill="none">
            <path className="duo-edge" pathLength={1} stroke="#f4f6fb" strokeWidth="1.2" strokeOpacity="0.85" transform={c.stacked ? 'translate(0 -1.4)' : 'translate(-1.4 0)'} />
            <path className="duo-edge" pathLength={1} stroke="#ff3444" strokeWidth="1.2" strokeOpacity="0.9" transform={c.stacked ? 'translate(0 1.4)' : 'translate(1.4 0)'} />
            <path className="duo-run" pathLength={1} stroke="url(#duo-run)" strokeWidth="2.6" strokeLinecap="round" />
          </g>
        </svg>
        {/* The boundary charging while held — its own layer, so it fades without repainting. */}
        <svg aria-hidden="true" viewBox={band.viewBox} className="duo-charge pointer-events-none absolute overflow-visible" style={lineStyle}>
          <path ref={charge} fill="none" stroke="url(#duo-run)" strokeWidth="5" strokeOpacity="0.5" strokeLinecap="round" />
        </svg>

        {/* Two signals, from opposite edges, meeting in the middle. */}
        <span aria-hidden="true" className="duo-signal duo-signal-w" style={{ top: signalY, width: c.mark.x }} />
        <span aria-hidden="true" className="duo-signal duo-signal-r" style={{ top: signalY, left: c.mark.x }} />
        <span aria-hidden="true" className="duo-spark" style={{ left: c.mark.x, top: signalY }} />

        {FRAGMENTS.map((f, i) => (
          <span key={i} aria-hidden="true" className="intro-frag" style={{ top: f.top, left: f.left, width: f.width, color: f.color, animationDelay: f.delay }} />
        ))}

        <p className="intro-word pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 text-center" style={{ left: c.word.x, top: c.word.y }} aria-hidden="true">
          <span className="font-sans text-[0.95rem] font-light tracking-[0.6em] text-[var(--color-ink)] sm:text-[1.1rem]">AJ</span>
          <span className="duo-decode font-mono text-[0.64rem] tracking-[0.55em] whitespace-pre">
            <Decode start={reducedMotion ? null : 3200} />
          </span>
        </p>

        <Chess c={c} onPlay={playChess} />
      </div>


      {/* The circle's edge as it opens: white on one side, red on the other. */}
      <div ref={edge} aria-hidden="true" className="duo-iris-edge" style={{ left: c.mark.x - 100, top: c.mark.y - 100 }} />

      {/* Progress: a white arc and a red arc closing around the mark. */}
      <svg aria-hidden="true" viewBox="0 0 100 100" className="duo-hold-ring pointer-events-none absolute" style={{ left: c.mark.x - ringSize / 2, top: c.mark.y - ringSize / 2, width: ringSize, height: ringSize, transform: c.stacked ? 'rotate(-90deg)' : undefined }}>
        <circle cx="50" cy="50" r="48" fill="none" stroke="#fff" strokeOpacity="0.22" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        <path className="hold-arc" pathLength={1} d="M50 2 A48 48 0 0 0 50 98" fill="none" stroke="#f4f6fb" strokeWidth="2.1" strokeLinecap="round" />
        <path className="hold-arc" pathLength={1} d="M50 2 A48 48 0 0 1 50 98" fill="none" stroke="#ff4f5c" strokeWidth="2.1" strokeLinecap="round" />
      </svg>

      {/* The AJ mark, where the two sides meet — and where the way in begins. */}
      <div ref={mark} className="duo-mark pointer-events-none absolute" style={{ left: c.mark.x - markSize / 2, top: c.mark.y - markSize / 2, width: markSize, height: markSize }}>
        <span aria-hidden="true" className="duo-mark-halo absolute" />
        <div className="glitch glitch-w" aria-hidden="true">
          <MarkGhost size={markSize} />
        </div>
        <div className="glitch glitch-r" aria-hidden="true">
          <MarkGhost size={markSize} />
        </div>
        {/* A brief flicker partway through a hold, and again on the way in. */}
        <div className="glitch hold-ghost hold-ghost-w" aria-hidden="true">
          <MarkGhost size={markSize} />
        </div>
        <div className="glitch hold-ghost hold-ghost-r" aria-hidden="true">
          <MarkGhost size={markSize} />
        </div>
        <div className="intro-mark">
          <Logo size={markSize} draw sweep delay={2950} title="AJ" />
        </div>
      </div>

      <p id="duo-hold-hint" className="duo-hint pointer-events-none absolute -translate-x-1/2 text-center font-mono text-[0.7rem] tracking-[0.34em] whitespace-nowrap uppercase" style={{ left: c.mark.x, top: c.mark.y + ringSize / 2 + 12 }}>
        {leaving || hint === 'almost' ? 'Entering Digital World…' : 'Hold to enter'}
      </p>
    </div>
  );
}
