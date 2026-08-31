import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useActions, useCeremony, useDevice } from '../../state/experience';

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

/** Win messages, plus the hidden code. */
export default function Ceremony() {
  const ceremony = useCeremony();
  const { celebrate } = useActions();
  const { reducedMotion } = useDevice();
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    let idx = 0;
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === KONAMI[idx]) {
        idx += 1;
        if (idx === KONAMI.length) {
          idx = 0;
          setBurst((b) => b + 1);
          celebrate('Old habits. Nice one.');
        }
      } else {
        idx = key === KONAMI[0] ? 1 : 0;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [celebrate]);

  return (
    <>
      <AnimatePresence>
        {ceremony && (
          <motion.div
            className="pointer-events-none fixed inset-x-0 top-[max(5.5rem,12vh)] z-50 flex justify-center px-4"
            initial={{ opacity: 0, y: -16, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -12, filter: 'blur(10px)' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            role="status"
            aria-live="polite"
          >
            <div className="glass flex items-center gap-3 rounded-full px-6 py-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--env-accent)] shadow-[0_0_12px_var(--env-accent)]" />
              <p className="text-center text-[0.95rem] text-[var(--color-ink)]">{ceremony}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {burst > 0 && !reducedMotion && (
          <motion.div
            key={burst}
            className="pointer-events-none fixed inset-0 z-[55] grid place-items-center"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 2.6, ease: 'easeOut' }}
            onAnimationComplete={() => setBurst(0)}
          >
            <motion.span
              className="absolute h-40 w-40 rounded-full"
              style={{ background: 'radial-gradient(circle, var(--env-accent), transparent 62%)' }}
              initial={{ scale: 0.2, opacity: 0.7 }}
              animate={{ scale: 14, opacity: 0 }}
              transition={{ duration: 2, ease: 'easeOut' }}
            />
            {Array.from({ length: 38 }).map((_, i) => {
              const a = (i / 38) * Math.PI * 2;
              const d = 180 + (i % 7) * 60;
              return (
                <motion.span
                  key={i}
                  className="absolute h-1.5 w-1.5 rounded-full bg-[var(--env-accent)]"
                  style={{ boxShadow: '0 0 12px var(--env-accent)' }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{ x: Math.cos(a) * d, y: Math.sin(a) * d - 60, opacity: 0, scale: 0.4 }}
                  transition={{ duration: 1.6 + (i % 5) * 0.2, ease: 'easeOut' }}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
