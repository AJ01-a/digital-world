import { motion, useInView } from 'motion/react';
import { useRef } from 'react';
import { OMARCHY } from '../data/content';
import Panel from '../components/ui/Panel';
import Reveal, { RevealWords } from '../components/ui/Reveal';
import SectionShell from '../components/ui/SectionShell';
import TypingLines from '../components/ui/TypingLines';

const pane = {
  hidden: { opacity: 0, scale: 0.96, filter: 'blur(8px)' },
  shown: (i: number) => ({
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: { delay: 0.25 + i * 0.14, duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export default function Omarchy() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });

  return (
    <SectionShell id="omarchy" labelledBy="omarchy-title" size="auto">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <h2 id="omarchy-title" className="h-section">
            <RevealWords text={OMARCHY.line} />
          </h2>
          <Reveal delay={0.12} as="p" className="prose-lede mt-7">
            {OMARCHY.body}
          </Reveal>
          <Reveal delay={0.22} className="mt-8">
            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {OMARCHY.specs.map(([k, v]) => (
                <div key={k} className="flex flex-col gap-1 border-l border-[color-mix(in_oklab,var(--env-accent)_25%,transparent)] pl-4">
                  <dt className="font-mono text-[0.66rem] tracking-[0.24em] text-[var(--env-accent)] uppercase">{k}</dt>
                  <dd className="text-sm text-[var(--color-ink-dim)]">{v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <div className="lg:col-span-7">
          {/* A tiling workspace assembling itself, pane by pane. */}
          <div ref={ref} className="grid h-full min-h-[330px] grid-cols-3 grid-rows-[auto_1fr_auto] gap-3">
            <motion.div className="col-span-3" custom={0} variants={pane} initial="hidden" animate={inView ? 'shown' : 'hidden'}>
              <Panel className="flex items-center gap-3 px-4 py-2.5">
                <span className="flex gap-1.5">
                  {['#f2a65a', '#7fd1a6', '#79a8ff'].map((c) => (
                    <span key={c} className="h-2 w-2 rounded-full opacity-70" style={{ background: c }} />
                  ))}
                </span>
                <span className="font-mono text-[0.7rem] tracking-[0.2em] text-[var(--color-ink-dim)] uppercase">
                  workspace 1 · omarchy
                </span>
                <span className="hairline ml-auto hidden h-px w-24 sm:block" />
              </Panel>
            </motion.div>

            <motion.div className="col-span-3 sm:col-span-2" custom={1} variants={pane} initial="hidden" animate={inView ? 'shown' : 'hidden'}>
              <Panel className="h-full p-4">
                <p className="mb-3 font-mono text-[0.66rem] tracking-[0.22em] text-[var(--env-tint)] uppercase">tty</p>
                <TypingLines
                  lines={OMARCHY.boot}
                  start={inView}
                  speed={16}
                  linePause={150}
                  className="space-y-1.5 font-mono text-[0.72rem] leading-relaxed text-[var(--color-ink-dim)] sm:text-[0.8rem]"
                />
              </Panel>
            </motion.div>

            <motion.div className="col-span-3 sm:col-span-1" custom={2} variants={pane} initial="hidden" animate={inView ? 'shown' : 'hidden'}>
              <Panel className="h-full p-4">
                <p className="mb-3 font-mono text-[0.66rem] tracking-[0.22em] text-[var(--env-tint)] uppercase">load</p>
                <div className="flex h-[calc(100%-1.75rem)] min-h-[90px] items-end gap-1">
                  {Array.from({ length: 18 }).map((_, i) => (
                    <motion.span
                      key={i}
                      className="flex-1 rounded-sm bg-[var(--env-accent)]"
                      initial={{ height: '8%', opacity: 0.35 }}
                      animate={
                        inView
                          ? { height: [`${12 + ((i * 37) % 60)}%`, `${20 + ((i * 53) % 70)}%`, `${10 + ((i * 29) % 55)}%`], opacity: 0.75 }
                          : undefined
                      }
                      transition={{ duration: 3.2 + (i % 5) * 0.5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
                    />
                  ))}
                </div>
              </Panel>
            </motion.div>

            <motion.div className="col-span-3" custom={3} variants={pane} initial="hidden" animate={inView ? 'shown' : 'hidden'}>
              <Panel className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <span className="font-mono text-[0.7rem] tracking-[0.16em] text-[var(--color-ink-faint)]">
                  ~/dotfiles · keyboard-first · rebuilt more times than necessary
                </span>
                <span className="font-mono text-[0.7rem] tracking-[0.16em] text-[var(--env-accent)]">tiled</span>
              </Panel>
            </motion.div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
