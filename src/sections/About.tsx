import { useCallback, useState } from 'react';
import { ABOUT, FACTS } from '../data/content';
import Button, { Arrow } from '../components/ui/Button';
import Panel from '../components/ui/Panel';
import Reveal, { RevealWords } from '../components/ui/Reveal';
import SectionShell from '../components/ui/SectionShell';

export default function About() {
  const [fact, setFact] = useState(0);
  const [seen, setSeen] = useState(() => new Set([0]));

  const shuffle = useCallback(() => {
    let next = fact;
    while (next === fact) next = Math.floor(Math.random() * FACTS.length);
    setFact(next);
    setSeen((s) => new Set(s).add(next));
  }, [fact]);

  return (
    <SectionShell id="about" labelledBy="about-title">
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <h2 id="about-title" className="display text-[clamp(2.6rem,1.6rem+4vw,5rem)] text-[var(--color-ink)]">
            <RevealWords text={ABOUT.head} />
          </h2>
          <Reveal
            delay={0.1}
            as="p"
            className="serif mt-6 max-w-[30ch] text-[clamp(1.4rem,1.1rem+1.2vw,2.1rem)] leading-[1.3] text-[color-mix(in_oklab,var(--color-ink)_92%,var(--env-tint))]"
          >
            {ABOUT.lede}
          </Reveal>
          <div className="mt-8 space-y-5">
            {ABOUT.body.map((p, i) => (
              <Reveal key={i} delay={0.12 + i * 0.08} as="p" className="prose-lede">
                {p}
              </Reveal>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5">
          <Reveal delay={0.15}>
            <Panel brackets className="p-2">
              <p className="label px-5 pt-4 pb-2 text-[var(--env-tint)]">What I'm about</p>
              <ul className="grid sm:grid-cols-2 lg:grid-cols-1">
                {ABOUT.facets.map((f, i) => (
                  <li
                    key={f.k}
                    className="group relative flex gap-4 border-t border-[color-mix(in_oklab,var(--env-accent)_10%,transparent)] px-5 py-3.5 transition-colors duration-300 hover:bg-[color-mix(in_oklab,var(--env-accent)_6%,transparent)]"
                  >
                    <span className="mt-0.5 font-mono text-[0.62rem] text-[var(--env-accent)] opacity-60">{String(i + 1).padStart(2, '0')}</span>
                    <span className="flex flex-col gap-1">
                      <span className="font-display text-[0.86rem] tracking-[-0.01em] text-[var(--color-ink)]">{f.k}</span>
                      <span className="text-[0.9rem] leading-relaxed text-[var(--color-ink-dim)]">{f.v}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          </Reveal>
        </div>
      </div>

      {/* Discover something random */}
      <Reveal delay={0.1} className="mt-14">
        <Panel className="flex flex-col items-start gap-6 overflow-hidden p-6 md:flex-row md:items-center md:gap-10 md:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute -top-24 -left-10 h-56 w-56 rounded-full" style={{ background: 'radial-gradient(circle, color-mix(in oklab, var(--env-accent) 16%, transparent), transparent 70%)' }} />
          <div className="relative min-w-0 flex-1">
            <p className="eyebrow mb-3">Random access memory</p>
            <div className="min-h-[4.5rem] sm:min-h-[3.5rem]" aria-live="polite">
              <p key={fact} className="text-[clamp(1.1rem,1rem+0.7vw,1.6rem)] leading-snug font-light text-[var(--color-ink)]" style={{ animation: 'rise-in 500ms var(--ease-out-expo) both' }}>
                {FACTS[fact]}
              </p>
            </div>
          </div>
          <div className="relative flex shrink-0 flex-col items-start gap-3 md:items-end">
            <Button onClick={shuffle}>
              Discover something random
              <Arrow />
            </Button>
            <span className="label text-[var(--env-tint)] opacity-70">
              {String(seen.size).padStart(2, '0')} / {String(FACTS.length).padStart(2, '0')} found
            </span>
          </div>
        </Panel>
      </Reveal>
    </SectionShell>
  );
}
