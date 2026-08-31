import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useState } from 'react';
import { ABOUT, FACTS } from '../data/content';
import MagneticButton from '../components/ui/MagneticButton';
import Panel from '../components/ui/Panel';
import Reveal, { RevealWords } from '../components/ui/Reveal';
import SectionShell from '../components/ui/SectionShell';

export default function About() {
  const [fact, setFact] = useState(0);
  const [seen, setSeen] = useState(1);

  const shuffle = useCallback(() => {
    setFact((current) => {
      let next = current;
      while (next === current) next = Math.floor(Math.random() * FACTS.length);
      return next;
    });
    setSeen((s) => Math.min(s + 1, FACTS.length));
  }, []);

  return (
    <SectionShell id="about" labelledBy="about-title">
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <h2 id="about-title" className="h-section text-[var(--color-ink)]">
            <RevealWords text={ABOUT.head} />
          </h2>
          <Reveal
            delay={0.1}
            as="p"
            className="mt-6 max-w-[32ch] text-[clamp(1.3rem,1.05rem+1.05vw,1.9rem)] leading-[1.35] font-light text-[color-mix(in_oklab,var(--color-ink)_92%,var(--env-tint))]"
          >
            {ABOUT.lede}
          </Reveal>
          <div className="mt-8 space-y-6">
            {ABOUT.body.map((p, i) => (
              <Reveal key={i} delay={0.1 + i * 0.1} as="p" className="prose-lede">
                {p}
              </Reveal>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5">
          <Reveal delay={0.15}>
            <Panel className="p-2">
              <ul className="divide-y divide-[color-mix(in_oklab,var(--env-accent)_12%,transparent)]">
                {ABOUT.facets.map((f) => (
                  <li key={f.k} className="group relative flex flex-col gap-1 px-5 py-4 transition-colors duration-300 hover:bg-[color-mix(in_oklab,var(--env-accent)_7%,transparent)]">
                    <span
                      aria-hidden="true"
                      className="absolute top-4 bottom-4 left-0 w-px origin-top scale-y-0 bg-[var(--env-accent)] transition-transform duration-500 group-hover:scale-y-100"
                    />
                    <span className="font-mono text-[0.66rem] tracking-[0.26em] text-[var(--env-accent)] uppercase">
                      {f.k}
                    </span>
                    <span className="text-[0.95rem] leading-relaxed text-[var(--color-ink-dim)]">{f.v}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </Reveal>
        </div>
      </div>

      {/* Discover something random */}
      <Reveal delay={0.1} className="mt-16">
        <Panel className="flex flex-col items-start gap-7 p-7 md:flex-row md:items-center md:gap-10 md:p-9">
          <div className="min-w-0 flex-1">
            <p className="eyebrow mb-4">Random access memory</p>
            <div className="relative min-h-[4.5rem] sm:min-h-[3.5rem]">
              <AnimatePresence mode="wait">
                <motion.p
                  key={fact}
                  className="text-[clamp(1.15rem,1rem+0.9vw,1.75rem)] leading-snug font-light text-[var(--color-ink)]"
                  initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -14, filter: 'blur(8px)' }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                >
                  {FACTS[fact]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
            <MagneticButton onClick={shuffle}>
              Discover something random
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </MagneticButton>
            <span className="font-mono text-[0.7rem] tracking-[0.22em] text-[var(--env-tint)] uppercase opacity-70">
              {String(seen).padStart(2, '0')} / {String(FACTS.length).padStart(2, '0')} found
            </span>
          </div>
        </Panel>
      </Reveal>
    </SectionShell>
  );
}
