import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AUTOMATION_COPY, AUTOMATION_STEPS, PIPELINE } from '../data/content';
import MagneticButton from '../components/ui/MagneticButton';
import Panel from '../components/ui/Panel';
import Reveal, { RevealWords } from '../components/ui/Reveal';
import SectionShell from '../components/ui/SectionShell';
import { useDevice } from '../state/experience';
import { cn } from '../lib/utils';

type Line = { kind: 'cmd' | 'out' | 'ok'; text: string };

/** Which pipeline node is lit for each simulated step. */
const STAGE_FOR_STEP = [1, 1, 2, 2, 3, 4];

export default function Automation() {
  const { reducedMotion } = useDevice();
  const [lines, setLines] = useState<Line[]>([]);
  const [typing, setTyping] = useState('');
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [stage, setStage] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const cancelled = useRef(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => { cancelled.current = true; }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [lines, typing]);

  const run = useCallback(async () => {
    if (running) return;
    cancelled.current = false;
    setRunning(true);
    setFinished(false);
    setLines([]);
    setTyping('');
    setStage(0);

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, reducedMotion ? Math.min(ms, 60) : ms));

    for (let s = 0; s < AUTOMATION_STEPS.length; s++) {
      if (cancelled.current) return;
      const step = AUTOMATION_STEPS[s];
      setStage(STAGE_FOR_STEP[s] ?? 1);

      if (reducedMotion) {
        setTyping(step.cmd);
      } else {
        for (let i = 1; i <= step.cmd.length; i++) {
          if (cancelled.current) return;
          setTyping(step.cmd.slice(0, i));
          await sleep(14);
        }
      }
      await sleep(160);
      if (cancelled.current) return;
      setTyping('');
      setLines((l) => [...l, { kind: 'cmd', text: step.cmd }]);

      for (const out of step.out) {
        await sleep(step.ms / (step.out.length + 1));
        if (cancelled.current) return;
        setLines((l) => [...l, { kind: 'out', text: out }]);
      }
      await sleep(140);
    }

    if (cancelled.current) return;
    setLines((l) => [...l, { kind: 'ok', text: '✓ complete — idea is now a thing that runs' }]);
    setStage(4);
    setRunning(false);
    setFinished(true);
  }, [running, reducedMotion]);

  return (
    <SectionShell id="automation" labelledBy="automation-title">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <h2 id="automation-title" className="h-section">
            <RevealWords text={AUTOMATION_COPY.lede} />
          </h2>
          <Reveal delay={0.12} as="p" className="prose-lede mt-7">
            {AUTOMATION_COPY.body}
          </Reveal>
        </div>

        <div className="lg:col-span-7">
          <Reveal delay={0.15}>
            <Panel className="overflow-hidden">
              <div className="flex items-center gap-3 border-b border-[color-mix(in_oklab,var(--env-accent)_14%,transparent)] px-4 py-3">
                <span className="flex gap-1.5">
                  {['#ff6b6b', '#f5c26b', '#7fd1a6'].map((c) => (
                    <span key={c} className="h-2.5 w-2.5 rounded-full opacity-60" style={{ background: c }} />
                  ))}
                </span>
                <span className="font-mono text-[0.7rem] tracking-[0.18em] text-[var(--color-ink-dim)]">
                  aj@wsl:~/projects
                </span>
                <span className="ml-auto font-mono text-[0.66rem] tracking-[0.18em] text-[var(--env-accent)] uppercase">
                  {running ? 'running' : finished ? 'done' : 'idle'}
                </span>
              </div>

              <div
                ref={logRef}
                className="h-[300px] overflow-y-auto px-4 py-4 font-mono text-[0.72rem] leading-[1.9] sm:h-[360px] sm:text-[0.8rem]"
                aria-live="polite"
              >
                {lines.length === 0 && !running && (
                  <p className="text-[var(--color-ink-faint)]">
                    <span className="text-[var(--env-accent)]">$</span> waiting for an idea…
                  </p>
                )}
                <AnimatePresence initial={false}>
                  {lines.map((l, i) => (
                    <motion.p
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25 }}
                      className={cn(
                        'break-words whitespace-pre-wrap',
                        l.kind === 'cmd' && 'text-[var(--color-ink)]',
                        l.kind === 'out' && 'pl-4 text-[var(--color-ink-dim)] opacity-80',
                        l.kind === 'ok' && 'mt-2 text-[var(--env-accent)]',
                      )}
                    >
                      {l.kind === 'cmd' && <span className="mr-2 text-[var(--env-accent)]">$</span>}
                      {l.kind === 'out' && <span className="mr-2 opacity-50">›</span>}
                      {l.text}
                    </motion.p>
                  ))}
                </AnimatePresence>
                {typing && (
                  <p className="break-words whitespace-pre-wrap text-[var(--color-ink)]">
                    <span className="mr-2 text-[var(--env-accent)]">$</span>
                    {typing}
                    <span className="ml-0.5 inline-block h-[1em] w-[0.5em] translate-y-[0.12em] bg-[var(--env-accent)]" style={{ animation: 'caret 1s steps(1) infinite' }} />
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[color-mix(in_oklab,var(--env-accent)_14%,transparent)] px-4 py-4">
                <MagneticButton onClick={run} variant={finished ? 'ghost' : 'solid'}>
                  {running ? 'Running…' : finished ? 'Run again' : 'Run simulation'}
                </MagneticButton>
                <p className="font-mono text-[0.66rem] tracking-[0.16em] text-[var(--color-ink-faint)] uppercase">
                  {AUTOMATION_COPY.disclaimer}
                </p>
              </div>
            </Panel>
          </Reveal>
        </div>
      </div>

      {/* idea → claude code → wsl → code → application */}
      <Reveal delay={0.15} className="mt-12">
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
          {PIPELINE.map((node, i) => {
            const lit = (running || finished) && i <= stage;
            const isCurrent = (running || finished) && i === stage;
            return (
              <li
                key={node.id}
                className="relative"
                onPointerEnter={() => setHovered(node.id)}
                onPointerLeave={() => setHovered(null)}
              >
                <div
                  className={cn(
                    'h-full rounded-xl border p-4 transition-all duration-500',
                    lit
                      ? 'border-[color-mix(in_oklab,var(--env-accent)_45%,transparent)] bg-[color-mix(in_oklab,var(--env-accent)_9%,transparent)]'
                      : 'border-[color-mix(in_oklab,var(--env-accent)_14%,transparent)] bg-[color-mix(in_oklab,var(--env-void)_45%,transparent)]',
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        'relative grid h-2.5 w-2.5 shrink-0 place-items-center rounded-full transition-colors duration-500',
                        lit ? 'bg-[var(--env-accent)]' : 'bg-[color-mix(in_oklab,var(--env-accent)_30%,transparent)]',
                      )}
                    >
                      {isCurrent && !reducedMotion && (
                        <span
                          className="absolute inset-0 rounded-full bg-[var(--env-accent)]"
                          style={{ animation: 'pulse-ring 1.6s ease-out infinite' }}
                        />
                      )}
                    </span>
                    <span
                      className={cn(
                        'font-mono text-[0.7rem] tracking-[0.22em] uppercase transition-colors duration-500',
                        lit ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-dim)]',
                      )}
                    >
                      {node.label}
                    </span>
                    <span className="ml-auto font-mono text-[0.64rem] text-[var(--color-ink-faint)]">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <p
                    className={cn(
                      'mt-2.5 text-[0.82rem] leading-relaxed transition-colors duration-500',
                      hovered === node.id || lit ? 'text-[var(--color-ink-dim)]' : 'text-[var(--color-ink-faint)]',
                    )}
                  >
                    {node.detail}
                  </p>
                </div>
                {i < PIPELINE.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 -right-3 hidden h-px w-3 lg:block"
                    style={{ background: 'color-mix(in oklab, var(--env-accent) 35%, transparent)' }}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </Reveal>
    </SectionShell>
  );
}
