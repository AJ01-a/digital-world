import { useMemo, useState } from 'react';
import { TECH_COPY, TOPICS } from '../data/content';
import Panel from '../components/ui/Panel';
import Reveal, { RevealWords } from '../components/ui/Reveal';
import SectionShell from '../components/ui/SectionShell';
import { useReveal } from '../hooks/useInView';
import { useDevice } from '../state/hooks';
import { cn } from '../lib/utils';

export default function Tech() {
  const { compact, reducedMotion } = useDevice();
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeTopic = TOPICS.find((t) => t.id === activeId) ?? null;
  const mapRef = useReveal<HTMLDivElement>();

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
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
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

          <div className="mt-5 min-h-[8rem]" aria-live="polite">
            {activeTopic ? (
              <div key={activeTopic.id} style={{ animation: 'rise-in 400ms var(--ease-out-expo) both' }}>
                <Panel className="p-5">
                  <p className="label text-[var(--env-accent)]">{activeTopic.label}</p>
                  <p className="mt-3 leading-relaxed text-[var(--color-ink-dim)]">{activeTopic.blurb}</p>
                </Panel>
              </div>
            ) : (
              <p className="serif max-w-[34ch] text-[1.15rem] leading-relaxed text-[var(--color-ink-faint)]">{TECH_COPY.idle}</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-7">
          <Reveal delay={0.15}>
            <Panel brackets className="p-4 sm:p-6">
              <div className="mb-3 flex items-center justify-between">
                <span className="label text-[var(--env-tint)]">Signal map</span>
                <span className="label text-[var(--color-ink-faint)]">{TOPICS.length} nodes · learning</span>
              </div>
              <div
                ref={mapRef}
                className="group/map relative aspect-[4/3] w-full sm:aspect-[16/11]"
                onPointerLeave={() => !compact && setActiveId(null)}
                style={{
                  backgroundImage:
                    'radial-gradient(circle, color-mix(in oklab, var(--env-accent) 18%, transparent) 1px, transparent 1.2px)',
                  backgroundSize: '22px 22px',
                }}
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
                          strokeWidth={lit ? 1.6 : 1}
                          strokeOpacity={lit ? 0.85 : activeId ? 0.1 : 0.3}
                          vectorEffect="non-scaling-stroke"
                          style={{ transition: 'stroke-opacity 300ms, stroke-width 300ms' }}
                        />
                        {/* Signal pulses only travel the lit edges, and only while lit. */}
                        {lit && !reducedMotion && (
                          <line
                            x1={a.x * 100}
                            y1={a.y * 100}
                            x2={b.x * 100}
                            y2={b.y * 100}
                            stroke="#ffffff"
                            strokeWidth="2"
                            strokeOpacity="0.9"
                            strokeDasharray="3 40"
                            strokeLinecap="round"
                            vectorEffect="non-scaling-stroke"
                            style={{ animation: 'dash 3s linear infinite' }}
                          />
                        )}
                      </g>
                    );
                  })}
                </svg>

                {TOPICS.map((t, i) => {
                  const isActive = activeId === t.id;
                  const dimmed = activeId !== null && !isActive && !t.links.includes(activeId) && !TOPICS.find((x) => x.id === activeId)?.links.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className="reveal absolute -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline-offset-4"
                      style={{ left: `${t.x * 100}%`, top: `${t.y * 100}%`, ['--d' as string]: `${200 + i * 60}ms` }}
                      onPointerEnter={() => !compact && setActiveId(t.id)}
                      // Only keyboard focus opens a node: a tap focuses the
                      // button first, which would otherwise make the click
                      // toggle it straight back off.
                      onFocus={(e) => {
                        if (e.currentTarget.matches(':focus-visible')) setActiveId(t.id);
                      }}
                      onClick={() => setActiveId((cur) => (cur === t.id ? null : t.id))}
                      aria-pressed={isActive}
                    >
                      <span
                        className={cn(
                          'flex items-center gap-2 rounded-full border px-3 py-2.5 whitespace-nowrap transition-[border-color,background-color,opacity] duration-300',
                          isActive
                            ? 'border-[var(--env-accent)] bg-[color-mix(in_oklab,var(--env-accent)_20%,var(--env-void))]'
                            : 'border-[color-mix(in_oklab,var(--env-accent)_24%,transparent)] bg-[color-mix(in_oklab,var(--env-void)_88%,transparent)]',
                          dimmed && 'opacity-40',
                        )}
                      >
                        <span className={cn('relative h-1.5 w-1.5 rotate-45 bg-[var(--env-accent)]', isActive && 'scale-150')}>
                          {isActive && !reducedMotion && (
                            <span className="absolute inset-0 bg-[var(--env-accent)]" style={{ animation: 'pulse-ring 1.8s ease-out infinite' }} />
                          )}
                        </span>
                        <span className={cn('font-mono text-[0.64rem] tracking-[0.14em] uppercase', isActive ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-dim)]')}>
                          {t.label}
                        </span>
                      </span>
                    </button>
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
