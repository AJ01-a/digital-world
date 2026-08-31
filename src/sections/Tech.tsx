import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { TECH_COPY, TOPICS } from '../data/content';
import Panel from '../components/ui/Panel';
import Reveal, { RevealWords } from '../components/ui/Reveal';
import SectionShell from '../components/ui/SectionShell';
import { useExperience } from '../state/experience';
import { cn } from '../lib/utils';

export default function Tech() {
  const { compact, reducedMotion } = useExperience();
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeTopic = TOPICS.find((t) => t.id === activeId) ?? null;

  const edges = useMemo(() => {
    const seen = new Set<string>();
    const out: { a: (typeof TOPICS)[number]; b: (typeof TOPICS)[number]; key: string }[] = [];
    for (const t of TOPICS) {
      for (const id of t.links) {
        const other = TOPICS.find((x) => x.id === id);
        if (!other) continue;
        const key = [t.id, id].sort().join('-');
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ a: t, b: other, key });
      }
    }
    return out;
  }, []);

  return (
    <SectionShell id="tech" labelledBy="tech-title">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <h2 id="tech-title" className="h-section">
            <RevealWords text={TECH_COPY.lede} />
          </h2>
          <Reveal delay={0.12} as="p" className="prose-lede mt-7">
            {TECH_COPY.body}
          </Reveal>
          <Reveal delay={0.2} className="mt-8">
            <p className="eyebrow">{compact ? TECH_COPY.hintTouch : TECH_COPY.hint}</p>
          </Reveal>

          <div className="mt-6 min-h-[7.5rem]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTopic?.id ?? 'idle'}
                initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                {activeTopic ? (
                  <Panel className="p-5">
                    <p className="font-mono text-[0.65rem] tracking-[0.26em] text-[var(--env-accent)] uppercase">
                      {activeTopic.label}
                    </p>
                    <p className="mt-3 leading-relaxed text-[var(--color-ink-dim)]">{activeTopic.blurb}</p>
                  </Panel>
                ) : (
                  <p className="max-w-[40ch] text-sm leading-relaxed text-[var(--color-ink-faint)] italic">
                    Eight things I am somewhere along the road with. None of them finished.
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="lg:col-span-7">
          <Reveal delay={0.15}>
            <Panel className="p-4 sm:p-6">
              <div
                className="relative aspect-[4/3] w-full sm:aspect-[16/11]"
                onPointerLeave={() => !compact && setActiveId(null)}
              >
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
                  {edges.map(({ a, b, key }) => {
                    const lit = activeId === a.id || activeId === b.id;
                    return (
                      <g key={key}>
                        <line
                          x1={a.x * 100}
                          y1={a.y * 100}
                          x2={b.x * 100}
                          y2={b.y * 100}
                          stroke="var(--env-accent)"
                          strokeWidth={lit ? 0.5 : 0.28}
                          strokeOpacity={lit ? 0.8 : activeId ? 0.12 : 0.34}
                          vectorEffect="non-scaling-stroke"
                          style={{ transition: 'stroke-opacity 400ms, stroke-width 400ms' }}
                        />
                        {!reducedMotion && (
                          <line
                            x1={a.x * 100}
                            y1={a.y * 100}
                            x2={b.x * 100}
                            y2={b.y * 100}
                            stroke="var(--env-accent)"
                            strokeWidth="0.6"
                            strokeOpacity={lit ? 0.9 : 0.35}
                            strokeDasharray="2 26"
                            vectorEffect="non-scaling-stroke"
                            style={{ animation: `dash ${8 + (key.length % 5)}s linear infinite` }}
                          />
                        )}
                      </g>
                    );
                  })}
                </svg>

                {TOPICS.map((t, i) => {
                  const isActive = activeId === t.id;
                  const dimmed = activeId !== null && !isActive;
                  return (
                    <motion.button
                      key={t.id}
                      type="button"
                      className="absolute -translate-x-1/2 -translate-y-1/2 focus-visible:outline-offset-6"
                      style={{ left: `${t.x * 100}%`, top: `${t.y * 100}%` }}
                      onPointerEnter={() => !compact && setActiveId(t.id)}
                      // Only keyboard focus opens a node: a tap focuses the
                      // button first, which would otherwise make the click
                      // toggle it straight back off.
                      onFocus={(e) => {
                        if (e.currentTarget.matches(':focus-visible')) setActiveId(t.id);
                      }}
                      onClick={() => setActiveId((cur) => (cur === t.id ? null : t.id))}
                      aria-pressed={isActive}
                      initial={{ opacity: 0, scale: 0.7 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{ delay: 0.05 * i, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <span
                        className={cn(
                          'flex items-center gap-2 rounded-full border px-3 py-2.5 whitespace-nowrap backdrop-blur-md transition-all duration-400',
                          isActive
                            ? 'border-[var(--env-accent)] bg-[color-mix(in_oklab,var(--env-accent)_18%,transparent)]'
                            : 'border-[color-mix(in_oklab,var(--env-accent)_22%,transparent)] bg-[color-mix(in_oklab,var(--env-void)_60%,transparent)]',
                          dimmed && 'opacity-40',
                        )}
                      >
                        <span
                          className={cn('relative h-1.5 w-1.5 rounded-full bg-[var(--env-accent)] transition-transform duration-400', isActive && 'scale-150')}
                        >
                          {isActive && !reducedMotion && (
                            <span
                              className="absolute inset-0 rounded-full bg-[var(--env-accent)]"
                              style={{ animation: 'pulse-ring 1.8s ease-out infinite' }}
                            />
                          )}
                        </span>
                        <span
                          className={cn(
                            'font-mono text-[0.66rem] tracking-[0.16em] uppercase transition-colors sm:text-[0.65rem]',
                            isActive ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-dim)]',
                          )}
                        >
                          {t.label}
                        </span>
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </Panel>
          </Reveal>
        </div>
      </div>
    </SectionShell>
  );
}
