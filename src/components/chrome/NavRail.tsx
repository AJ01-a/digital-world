import { AnimatePresence, motion, useScroll, useSpring } from 'motion/react';
import { useEffect, useState } from 'react';
import { RAIL_SCENES, SCENE_MAP, type SceneId } from '../../data/worlds';
import { useActions, useDevice, useEnv } from '../../state/experience';
import { cn } from '../../lib/utils';

/** Hidden scenes light up their parent entry in the rail. */
const PARENT: Partial<Record<SceneId, SceneId>> = { words: 'strategy', omarchy: 'tech' };

export default function NavRail() {
  const { active } = useEnv();
  const { goTo } = useActions();
  const { compact } = useDevice();
  const [open, setOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 22, mass: 0.4 });

  const railActive = PARENT[active] ?? active;
  const activeScene = SCENE_MAP[active];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  /* ── Desktop: a vertical rail on the right ── */
  if (!compact) {
    return (
      <nav aria-label="Sections" className="fixed top-1/2 right-6 z-40 hidden -translate-y-1/2 md:block">
        <div className="relative flex flex-col items-end gap-1.5 pr-4">
          <span aria-hidden="true" className="absolute top-2 right-0 bottom-2 w-px bg-[color-mix(in_oklab,var(--env-accent)_16%,transparent)]" />
          <motion.span
            aria-hidden="true"
            className="absolute top-2 right-0 w-px origin-top bg-[var(--env-accent)]"
            style={{ scaleY: progress, height: 'calc(100% - 1rem)' }}
          />
          {RAIL_SCENES.map((s) => {
            const isActive = railActive === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => goTo(s.id)}
                aria-current={isActive ? 'true' : undefined}
                className="group flex items-center justify-end gap-3 py-1.5"
              >
                <span
                  className={cn(
                    'font-mono text-[0.7rem] tracking-[0.22em] uppercase transition-all duration-400',
                    isActive
                      ? 'text-[var(--color-ink)] opacity-100'
                      : 'translate-x-1 text-[var(--color-ink-dim)] opacity-0 group-hover:translate-x-0 group-hover:opacity-90',
                  )}
                >
                  {s.label}
                </span>
                <span
                  className={cn(
                    'block rounded-full transition-all duration-400',
                    isActive
                      ? 'h-4 w-1 bg-[var(--env-accent)] shadow-[0_0_12px_var(--env-accent)]'
                      : 'h-1.5 w-1.5 bg-[color-mix(in_oklab,var(--env-accent)_45%,transparent)] group-hover:bg-[var(--env-accent)]',
                  )}
                />
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  /* ── Mobile: a pill that opens a full-screen index ── */
  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="glass flex items-center gap-3 rounded-full px-5 py-3"
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--env-accent)] shadow-[0_0_10px_var(--env-accent)]" />
          <span className="font-mono text-[0.64rem] tracking-[0.24em] text-[var(--color-ink)] uppercase">
            {activeScene.index} · {activeScene.label}
          </span>
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="opacity-60">
            <path d="M1 3h12M1 7h12M1 11h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Sections"
            className="fixed inset-0 z-50 flex flex-col justify-center px-[var(--shell)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            style={{ background: 'color-mix(in oklab, var(--env-void) 88%, transparent)', backdropFilter: 'blur(22px)' }}
          >
            <ul className="space-y-1">
              {RAIL_SCENES.map((s, i) => (
                <motion.li
                  key={s.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                >
                  <button
                    type="button"
                    className="flex w-full items-baseline gap-4 border-b border-white/5 py-4 text-left"
                    onClick={() => {
                      setOpen(false);
                      window.setTimeout(() => goTo(s.id), 180);
                    }}
                  >
                    <span className="font-mono text-[0.68rem] tracking-[0.2em] text-[var(--env-accent)]">{s.index}</span>
                    <span
                      className={cn(
                        'display text-[2rem]',
                        railActive === s.id ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-dim)]',
                      )}
                    >
                      {s.label}
                    </span>
                    <span className="ml-auto font-mono text-[0.66rem] tracking-[0.18em] text-[var(--color-ink-faint)] uppercase">
                      {s.mood}
                    </span>
                  </button>
                </motion.li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-10 self-center font-mono text-[0.7rem] tracking-[0.26em] text-[var(--env-tint)] uppercase"
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
