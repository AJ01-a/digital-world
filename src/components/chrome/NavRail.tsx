import { useCallback, useEffect, useRef, useState } from 'react';
import { RAIL_SCENES, SCENE_MAP, type SceneId } from '../../data/worlds';
import { useScrollProgress } from '../../hooks/useScrollProgress';
import { useActions, useDevice, useEnv } from '../../state/hooks';
import { cn } from '../../lib/utils';

/** Hidden scenes light up their parent entry in the rail. */
const PARENT: Partial<Record<SceneId, SceneId>> = { words: 'strategy', omarchy: 'tech', outro: 'clover' };

export default function NavRail() {
  const { active } = useEnv();
  const { goTo } = useActions();
  const { compact } = useDevice();
  const railActive = PARENT[active] ?? active;
  const line = useRef<HTMLSpanElement>(null);

  useScrollProgress(
    useCallback((p: number) => {
      if (line.current) line.current.style.transform = `scaleY(${p})`;
    }, []),
  );

  if (compact) return <MobileIndex railActive={railActive} />;

  return (
    <nav aria-label="Chapters" className="fixed top-1/2 right-5 z-40 -translate-y-1/2">
      <div className="relative flex flex-col items-end gap-1 pr-4">
        <span aria-hidden="true" className="absolute top-2 right-0 bottom-2 w-px bg-[color-mix(in_oklab,var(--env-accent)_14%,transparent)]" />
        <span
          ref={line}
          aria-hidden="true"
          className="absolute top-2 right-0 bottom-2 w-px origin-top scale-y-0"
          style={{ background: 'linear-gradient(180deg, #f4f6fb, #ff3444)' }}
        />
        {RAIL_SCENES.map((s) => {
          const isActive = railActive === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(s.id)}
              aria-current={isActive ? 'location' : undefined}
              className="group flex items-center justify-end gap-3 py-1.5"
            >
              <span
                className={cn(
                  'font-mono text-[0.66rem] tracking-[0.2em] uppercase transition-[opacity,transform,color] duration-300',
                  isActive
                    ? 'text-[var(--color-ink)] opacity-100'
                    : 'translate-x-1 text-[var(--color-ink-dim)] opacity-0 group-hover:translate-x-0 group-hover:opacity-90 group-focus-visible:translate-x-0 group-focus-visible:opacity-90',
                )}
              >
                <span className="mr-2 text-[var(--env-accent)] opacity-70">{s.index}</span>
                {s.label}
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  'block rotate-45 transition-all duration-300',
                  isActive
                    ? 'h-2 w-2 bg-[var(--env-accent)] shadow-[0_0_12px_var(--env-accent)]'
                    : 'h-1.5 w-1.5 bg-[color-mix(in_oklab,var(--env-accent)_40%,transparent)] group-hover:bg-[var(--env-accent)]',
                )}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ── Phones: a pill bottom-left (Clover lives bottom-right) that opens a full-screen index. ── */
function MobileIndex({ railActive }: { railActive: SceneId }) {
  const { active } = useEnv();
  const { goTo } = useActions();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const firstItem = useRef<HTMLButtonElement>(null);
  const activeScene = SCENE_MAP[active];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    firstItem.current?.focus();
    const t = trigger.current;
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      t?.focus();
    };
  }, [open]);

  return (
    <>
      <nav aria-label="Chapters" className="fixed bottom-0 left-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          ref={trigger}
          type="button"
          onClick={() => setOpen(true)}
          className="surface flex h-12 items-center gap-3 rounded-full px-5"
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span aria-hidden="true" className="h-1.5 w-1.5 rotate-45 bg-[var(--env-accent)] shadow-[0_0_10px_var(--env-accent)]" />
          <span className="font-mono text-[0.64rem] tracking-[0.22em] text-[var(--color-ink)] uppercase">
            <span className="sr-only">Chapter </span>
            {activeScene.index} · {activeScene.label}
          </span>
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="opacity-60">
            <path d="M1 3h12M1 7h12M1 11h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
      </nav>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Chapters"
          className="fixed inset-0 z-[60] flex flex-col justify-center overflow-y-auto px-[var(--shell)] py-16"
          style={{ background: 'linear-gradient(180deg, color-mix(in oklab, var(--env-b) 40%, #03040a), #03040a 60%)', animation: 'fade-in 220ms ease both' }}
        >
          <p className="eyebrow mb-4">Chapters</p>
          <ul className="space-y-0.5">
            {RAIL_SCENES.map((s, i) => (
              <li key={s.id} style={{ animation: `rise-in 450ms var(--ease-out-expo) ${i * 35}ms both` }}>
                <button
                  ref={i === 0 ? firstItem : undefined}
                  type="button"
                  aria-current={railActive === s.id ? 'location' : undefined}
                  className="flex w-full items-baseline gap-4 border-b border-white/5 py-3.5 text-left"
                  onClick={() => {
                    setOpen(false);
                    window.setTimeout(() => goTo(s.id), 120);
                  }}
                >
                  <span className="font-mono text-[0.66rem] tracking-[0.2em] text-[var(--env-accent)]">{s.index}</span>
                  <span
                    className={cn(
                      'font-display text-[1.45rem] font-light tracking-[-0.02em]',
                      railActive === s.id ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-dim)]',
                    )}
                  >
                    {s.label}
                  </span>
                  <span className="ml-auto font-mono text-[0.62rem] tracking-[0.18em] text-[var(--color-ink-faint)] uppercase">{s.mood}</span>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="btn btn-ghost mt-8 self-center"
          >
            Close
          </button>
        </div>
      )}
    </>
  );
}
