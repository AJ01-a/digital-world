import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import Logo, { BAR, MARK } from '../ui/Logo';
import { markIntroSeen } from '../../lib/intro';
import { mulberry32 } from '../../lib/utils';

const AUTO_EXIT_MS = 2700;
const LEAVE_MS = 700;

/** Short horizontal shards of light that flicker before the mark forms. */
const FRAGMENTS = (() => {
  const rnd = mulberry32(7);
  return Array.from({ length: 14 }, () => ({
    top: `${18 + rnd() * 64}%`,
    left: `${8 + rnd() * 76}%`,
    width: `${20 + rnd() * 120}px`,
    delay: `${120 + rnd() * 700}ms`,
    color: rnd() > 0.8 ? '#ff9b52' : rnd() > 0.4 ? '#5ce1ff' : '#b8d4ff',
  }));
})();

const WORD = 'DIGITAL WORLD';
const GLYPHS = '01<>/\\[]{}#*+=';

function Decode({ start }: { start: number }) {
  const [text, setText] = useState(() => WORD.replace(/\S/g, ' '));
  useEffect(() => {
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

/** A flat silhouette of the mark, used for the RGB-split glitch copies. */
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

export default function Intro({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);
  const size = typeof window !== 'undefined' && window.innerWidth < 640 ? 132 : 176;

  const finish = useCallback(() => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
  }, []);

  useEffect(() => {
    markIntroSeen();
    const auto = window.setTimeout(finish, AUTO_EXIT_MS);
    const onKey = (e: KeyboardEvent) => {
      if (['Escape', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        finish();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(auto);
      window.removeEventListener('keydown', onKey);
    };
  }, [finish]);

  useEffect(() => {
    if (!leaving) return;
    const t = window.setTimeout(onDone, LEAVE_MS);
    return () => window.clearTimeout(t);
  }, [leaving, onDone]);

  return (
    <div className={leaving ? 'intro is-leaving' : 'intro'} onClick={finish}>
      <div className="intro-lines" aria-hidden="true" />
      <div className="intro-scan" aria-hidden="true" />
      {FRAGMENTS.map((f, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="intro-frag"
          style={{ top: f.top, left: f.left, width: f.width, color: f.color, animationDelay: f.delay } as CSSProperties}
        />
      ))}

      <div className="intro-stage">
        <div className="relative" style={{ width: size, height: size }}>
          <div className="glitch glitch-c" aria-hidden="true">
            <MarkGhost size={size} />
          </div>
          <div className="glitch glitch-o" aria-hidden="true">
            <MarkGhost size={size} />
          </div>
          <div className="intro-mark">
            <Logo size={size} draw sweep delay={760} title="AJ" />
          </div>
        </div>
        <p className="intro-word flex flex-col items-center gap-2 text-center" aria-hidden="true">
          <span className="font-sans text-[1.15rem] font-light tracking-[0.6em] text-[var(--color-ink)] sm:text-[1.35rem]">AJ</span>
          <span className="font-mono text-[0.68rem] tracking-[0.55em] whitespace-pre text-[#8fe6ff]">
            <Decode start={1500} />
          </span>
        </p>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          finish();
        }}
        className="intro-skip label absolute right-5 bottom-[max(1.25rem,env(safe-area-inset-bottom))] rounded-full border border-white/15 px-4 py-2.5 text-[var(--color-ink-dim)] transition-colors hover:border-white/35 hover:text-white sm:right-8 sm:bottom-8"
      >
        Skip intro
      </button>
    </div>
  );
}
