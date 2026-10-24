import { useState } from 'react';
import { primeAudio } from '../audio/ambient';
import { BUILDS, type Build } from '../data/content';
import Reveal, { RevealWords } from '../components/ui/Reveal';
import SectionShell from '../components/ui/SectionShell';
import { useActions, useAudioOn } from '../state/hooks';
import { cn } from '../lib/utils';

/** Small line icons, one per build — drawn, not downloaded. */
function Glyph({ id }: { id: string }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      {id === 'site' && <g {...common}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M7 6.5h.01M10 6.5h.01" /></g>}
      {id === 'clover' && <g {...common}><path d="M7 7c-2 0-4 2-4 5s1 4 2 4M17 7c2 0 4 2 4 5s-1 4-2 4" /><ellipse cx="12" cy="12" rx="6" ry="6.5" /><path d="M10 11h.01M14 11h.01M11 14.5h2" /></g>}
      {id === 'chess' && <g {...common}><path d="M8 20h8M9 17h6l-1-6h-4zM10 11l-1-3 3-4 3 4-1 3" /></g>}
      {id === 'words' && <g {...common}><rect x="3" y="7" width="5" height="5" rx="1" /><rect x="9.5" y="7" width="5" height="5" rx="1" /><rect x="16" y="7" width="5" height="5" rx="1" /><path d="M4 16h16" /></g>}
      {id === 'sound' && <g {...common}><path d="M4 12h2M8 8v8M12 5v14M16 9v6M20 11v2" /></g>}
      {id === 'art' && <g {...common}><path d="M3 18l5-7 4 5 3-3 6 5" /><circle cx="16.5" cy="7" r="2" /></g>}
    </svg>
  );
}

function BuildCard({ build, index, open, onToggle }: { build: Build; index: number; open: boolean; onToggle: () => void }) {
  const { goTo, openClover, toggleAudio } = useActions();
  const audioOn = useAudioOn();
  const panelId = `build-${build.id}`;

  const tryIt = () => {
    const t = build.try.target;
    if (t === 'clover') return openClover();
    if (t === 'ambient') {
      if (!audioOn) primeAudio();
      return toggleAudio();
    }
    goTo(t);
  };

  return (
    <article
      className={cn(
        'surface group relative flex h-full flex-col overflow-hidden p-5 transition-[border-color,transform] duration-500 md:p-6',
        open ? 'border-[color-mix(in_oklab,var(--env-accent)_45%,transparent)]' : 'hover:-translate-y-1 hover:border-[color-mix(in_oklab,var(--env-accent)_32%,transparent)]',
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full opacity-0 transition-opacity duration-700 group-hover:opacity-100"
        style={{ background: 'radial-gradient(circle, color-mix(in oklab, var(--env-accent) 22%, transparent), transparent 70%)' }}
      />
      <div className="flex items-start gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[color-mix(in_oklab,var(--env-accent)_26%,transparent)] text-[var(--env-accent)]" style={{ background: 'color-mix(in oklab, var(--env-accent) 7%, transparent)' }}>
          <Glyph id={build.id} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="label text-[var(--env-tint)]">
            {String(index + 1).padStart(2, '0')} · {build.kind}
          </p>
          <h3 className="mt-1.5 font-display text-[1.12rem] font-normal tracking-[-0.02em] text-[var(--color-ink)]">{build.name}</h3>
        </div>
        <span className="label hidden items-center gap-1.5 text-[#7fe7b0] sm:flex" title="Running on this page">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#7fe7b0]" />
          On this page
        </span>
      </div>

      <p className="mt-4 leading-relaxed text-[var(--color-ink-dim)]">{build.summary}</p>

      <div
        id={panelId}
        hidden={!open}
        className="mt-4 border-t border-[color-mix(in_oklab,var(--env-accent)_12%,transparent)] pt-4"
        style={open ? { animation: 'rise-in 400ms var(--ease-out-expo) both' } : undefined}
      >
        <p className="label mb-2.5 text-[var(--env-accent)]">How it works</p>
        <ul className="space-y-2">
          {build.how.map((h) => (
            <li key={h} className="flex gap-2.5 text-[0.92rem] leading-relaxed text-[var(--color-ink-dim)]">
              <span aria-hidden="true" className="mt-[0.6em] h-1 w-1 shrink-0 rotate-45 bg-[var(--env-accent)]" />
              {h}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
        {build.stack.map((s) => (
          <span key={s} className="rounded-md border border-white/[0.07] px-2 py-1 font-mono text-[0.64rem] text-[var(--color-ink-faint)]">
            {s}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <button type="button" className="btn btn-ghost min-h-10 px-4 text-[0.62rem]" aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
          {open ? 'Less' : 'How it works'}
        </button>
        <button type="button" className="btn btn-quiet min-h-10 text-[0.62rem]" onClick={tryIt}>
          {build.try.label} →
        </button>
      </div>
    </article>
  );
}

export default function Projects() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <SectionShell id="projects" labelledBy="projects-title">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <h2 id="projects-title" className="h-section">
            <RevealWords text="Built here, running now." />
          </h2>
        </div>
        <Reveal delay={0.12} as="p" className="prose-lede lg:col-span-5">
          No mock-ups. Every build below is part of this page, so you can go and poke at it — open one to see how it works.
        </Reveal>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BUILDS.map((b, i) => (
          <Reveal key={b.id} delay={0.05 * i} className={cn('h-full', i === 0 && 'sm:col-span-2 lg:col-span-2')}>
            <BuildCard build={b} index={i} open={open === b.id} onToggle={() => setOpen((cur) => (cur === b.id ? null : b.id))} />
          </Reveal>
        ))}
      </div>
    </SectionShell>
  );
}
