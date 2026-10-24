import { OMARCHY } from '../data/content';
import Panel from '../components/ui/Panel';
import Reveal, { RevealWords } from '../components/ui/Reveal';
import SectionShell from '../components/ui/SectionShell';
import { useReveal } from '../hooks/useInView';

/**
 * A tiling workspace, drawn rather than simulated: no fake boot log, no
 * invented load graphs — just the layout and the setup as AJ describes it.
 */
export default function Omarchy() {
  const ref = useReveal<HTMLDivElement>();

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
        </div>

        <div className="lg:col-span-7">
          <div ref={ref} className="grid min-h-[340px] grid-cols-6 grid-rows-[auto_1fr_auto] gap-2.5" aria-label="Illustration of a tiling desktop with the setup listed" role="group">
            <div className="reveal col-span-6" style={{ ['--d' as string]: '0ms' }}>
              <Panel className="flex items-center gap-2 rounded-xl px-3 py-2">
                {['1', '2', '3', '4'].map((n) => (
                  <span
                    key={n}
                    className={
                      n === '1'
                        ? 'grid h-6 w-6 place-items-center rounded-md bg-[var(--env-accent)] font-mono text-[0.66rem] text-[#050813]'
                        : 'grid h-6 w-6 place-items-center rounded-md font-mono text-[0.66rem] text-[var(--color-ink-faint)]'
                    }
                  >
                    {n}
                  </span>
                ))}
                <span className="label ml-2 text-[var(--color-ink-dim)]">omarchy</span>
                <span className="label ml-auto text-[var(--color-ink-faint)]">illustration</span>
              </Panel>
            </div>

            <div className="reveal col-span-6 sm:col-span-4" style={{ ['--d' as string]: '120ms' }}>
              <Panel className="h-full rounded-xl p-4">
                <p className="label mb-3 text-[var(--env-tint)]">~/setup</p>
                <dl className="space-y-2.5 font-mono text-[0.78rem]">
                  {OMARCHY.specs.map(([k, v]) => (
                    <div key={k} className="flex gap-3">
                      <dt className="w-24 shrink-0 text-[var(--env-accent)]">{k}</dt>
                      <dd className="text-[var(--color-ink-dim)]">{v}</dd>
                    </div>
                  ))}
                </dl>
              </Panel>
            </div>

            <div className="reveal col-span-3 sm:col-span-2" style={{ ['--d' as string]: '220ms' }}>
              <Panel className="flex h-full flex-col rounded-xl p-4">
                <p className="label mb-3 text-[var(--env-tint)]">nvim</p>
                <div className="space-y-2" aria-hidden="true">
                  {[72, 54, 88, 40, 64, 30, 76].map((w, i) => (
                    <span key={i} className="block h-1.5 rounded-full" style={{ width: `${w}%`, background: i % 3 === 0 ? 'color-mix(in oklab, var(--env-accent) 55%, transparent)' : 'rgba(255,255,255,0.09)' }} />
                  ))}
                </div>
              </Panel>
            </div>

            <div className="reveal col-span-3 sm:col-span-6" style={{ ['--d' as string]: '320ms' }}>
              <Panel className="flex h-full flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3">
                <span className="font-mono text-[0.72rem] text-[var(--color-ink-faint)]">keyboard-first · rebuilt more times than necessary</span>
                <span className="label text-[var(--env-accent)]">tiled</span>
              </Panel>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
