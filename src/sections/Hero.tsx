import type { CSSProperties } from 'react';
import { IDENTITY } from '../data/content';
import { SCENES } from '../data/worlds';
import { useActions } from '../state/hooks';
import Button, { Arrow } from '../components/ui/Button';
import Logo from '../components/ui/Logo';
import SectionShell from '../components/ui/SectionShell';

/** Entrance choreography — CSS only, plays once. `--d` is the delay. */
const rise = (d: number): CSSProperties => ({ animation: `rise-in 1000ms var(--ease-out-expo) ${d}ms both` });

/**
 * The orbital system around the monogram. The rings turn with the page
 * scroll (a scroll-driven CSS animation) rather than on a timer, so at rest
 * they cost nothing.
 */
function Emblem({ play }: { play: boolean }) {
  return (
    <div className="relative grid aspect-square w-[min(62vw,40svh,420px)] place-items-center lg:w-[min(36vw,480px)]" aria-hidden="true">
      {/* glow */}
      <div
        className="absolute inset-[12%] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(236,240,248,0.13) 0%, rgba(255,52,68,0.12) 42%, transparent 70%)' }}
      />
      <div className="orbit-scroll absolute inset-0">
        <svg viewBox="0 0 400 400" className="h-full w-full overflow-visible">
          <defs>
            {/* The intro's orbit: white on the left, red on the right. */}
            <linearGradient id="orbit-a" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#f4f6fb" stopOpacity="0.7" />
              <stop offset="0.45" stopColor="#f4f6fb" stopOpacity="0.06" />
              <stop offset="0.55" stopColor="#ff3444" stopOpacity="0.06" />
              <stop offset="1" stopColor="#ff3444" stopOpacity="0.65" />
            </linearGradient>
          </defs>
          <circle cx="200" cy="200" r="196" fill="none" stroke="url(#orbit-a)" strokeWidth="1" />
          <circle cx="200" cy="200" r="182" fill="none" stroke="#d9dde6" strokeOpacity="0.12" strokeWidth="1" strokeDasharray="1 7" />
          {/* degree ticks */}
          <g stroke="#d9dde6" strokeOpacity="0.3">
            {Array.from({ length: 72 }, (_, i) => {
              const a = (i / 72) * Math.PI * 2;
              const r1 = i % 6 === 0 ? 186 : 190;
              return (
                <line key={i} x1={200 + Math.cos(a) * r1} y1={200 + Math.sin(a) * r1} x2={200 + Math.cos(a) * 196} y2={200 + Math.sin(a) * 196} />
              );
            })}
          </g>
          {/* satellites */}
          <circle cx="200" cy="4" r="4" fill="#ff3444" />
          <circle cx="200" cy="4" r="10" fill="none" stroke="#ff3444" strokeOpacity="0.4" />
          <circle cx={200 + Math.cos(2.4) * 196} cy={200 + Math.sin(2.4) * 196} r="3" fill="#f4f6fb" />
        </svg>
      </div>
      <div className="orbit-scroll absolute inset-[13%]" style={{ animationDirection: 'reverse' }}>
        <svg viewBox="0 0 300 300" className="h-full w-full overflow-visible">
          <ellipse cx="150" cy="150" rx="148" ry="148" fill="none" stroke="#ff3444" strokeOpacity="0.2" strokeDasharray="60 14 4 14" />
          <circle cx={150 + Math.cos(-0.7) * 148} cy={150 + Math.sin(-0.7) * 148} r="4.5" fill="#ff9b52" />
        </svg>
      </div>
      <div className="absolute inset-[24%] rounded-full border border-white/[0.06]" style={{ background: 'radial-gradient(circle at 50% 35%, rgba(30,26,32,0.9), rgba(5,5,7,0.96) 70%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 30px 80px -30px rgba(0,0,0,0.9)' }} />
      {/* The intro's mark flies here on the way in (see Intro.tsx). */}
      <div className="relative w-[44%]" data-hero-mark>
        <Logo size={400} draw={play} sweep className="h-auto w-full" delay={play ? 200 : 600} />
      </div>
    </div>
  );
}

export default function Hero({ introPlayed, arrived }: { introPlayed: boolean; arrived: boolean }) {
  const { goTo, openClover } = useActions();
  // After the intro, the hero rises as the circle opens onto it; until then
  // it waits, unseen. Without the intro it arrives straight away.
  const base = introPlayed ? 300 : 150;
  const enter = (d: number): CSSProperties => (arrived ? rise(d) : { opacity: 0 });

  return (
    <SectionShell id="home" header={false} labelledBy="hero-title" className="overflow-hidden">
      <div className="grid items-center gap-6 pt-4 lg:grid-cols-12 lg:gap-6 lg:pt-0">
        <div className="order-2 flex flex-col items-center text-center lg:order-1 lg:col-span-7 lg:items-start lg:text-left">
          <p className="eyebrow mb-6 flex items-center gap-3" style={enter(base + 100)}>
            <span aria-hidden="true" className="h-px w-8 bg-[var(--env-accent)] opacity-70" />
            Welcome to the digital world of
          </p>

          <h1 id="hero-title" className="relative" style={enter(base + 180)}>
            <span className="sr-only">AJ — Digital World</span>
            <span
              aria-hidden="true"
              className="text-spectrum block font-sans text-[clamp(6rem,min(26vw,32svh),14rem)] leading-[0.8] font-[200] tracking-[-0.07em]"
            >
              AJ
            </span>
          </h1>

          <p className="serif mt-6 max-w-[30ch] text-[clamp(1.35rem,1.1rem+1.1vw,2.05rem)] leading-[1.25] text-[var(--color-ink)]" style={enter(base + 300)}>
            “{IDENTITY.greeting}”
          </p>

          <p className="prose-lede mt-5 max-w-[48ch] text-[var(--color-ink-dim)]" style={enter(base + 400)}>
            {IDENTITY.intro}
          </p>

          <ul className="mt-7 flex flex-wrap justify-center gap-2 lg:justify-start" style={enter(base + 480)}>
            {IDENTITY.keywords.map((k) => (
              <li key={k} className="chip">
                <span aria-hidden="true" className="h-1 w-1 rotate-45 bg-[var(--env-accent)]" />
                {k}
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row" style={enter(base + 560)}>
            <Button variant="solid" onClick={() => goTo('about')}>
              {IDENTITY.enter}
              <Arrow />
            </Button>
            <Button variant="ghost" onClick={() => openClover()}>
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#ff9b52] shadow-[0_0_10px_#ff9b52]" />
              Ask Clover
            </Button>
          </div>
        </div>

        <div className="order-1 flex justify-center lg:order-2 lg:col-span-5 lg:justify-end" style={arrived ? { animation: `fade-in ${introPlayed ? 900 : 1400}ms var(--ease-out-expo) ${introPlayed ? 0 : base}ms both` } : { opacity: 0 }}>
          <Emblem play={!introPlayed} />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-6 hidden items-center justify-center gap-3 lg:flex [@media(max-height:700px)]:hidden" aria-hidden="true" style={enter(base + 900)}>
        <span className="label text-[var(--env-tint)] opacity-70">Scroll</span>
        <span className="relative h-10 w-px overflow-hidden bg-[color-mix(in_oklab,var(--env-accent)_20%,transparent)]">
          <span className="absolute inset-x-0 h-3 bg-[var(--env-accent)]" style={{ animation: 'scroll-cue 2.4s var(--ease-in-out-quint) 3' }} />
        </span>
        <span className="label text-[var(--env-tint)] opacity-70">{SCENES.length} chapters</span>
      </div>
    </SectionShell>
  );
}
