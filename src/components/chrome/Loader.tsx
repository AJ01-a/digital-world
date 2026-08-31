import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import Logo from '../ui/Logo';

/** Short by design — it hides as soon as the fonts are ready. */
export default function Loader({ onDone }: { onDone: () => void }) {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const started = performance.now();
    let cancelled = false;
    const finish = () => {
      if (cancelled) return;
      const elapsed = performance.now() - started;
      window.setTimeout(() => {
        if (cancelled) return;
        setGone(true);
        window.setTimeout(onDone, 620);
      }, Math.max(0, 900 - elapsed));
    };
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts?.ready) fonts.ready.then(finish).catch(finish);
    else finish();
    const cap = window.setTimeout(finish, 2000);
    return () => {
      cancelled = true;
      window.clearTimeout(cap);
    };
  }, [onDone]);

  return (
    <AnimatePresence>
      {!gone && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6"
          style={{ background: '#05060b' }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(14px)', scale: 1.04 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <Logo size={64} interactive={false} />
          <div className="flex flex-col items-center gap-2">
            <motion.p
              className="font-mono text-[0.7rem] tracking-[0.5em] text-[var(--color-ink)] uppercase"
              initial={{ opacity: 0, letterSpacing: '0.9em' }}
              animate={{ opacity: 1, letterSpacing: '0.5em' }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              AJ
            </motion.p>
            <motion.p
              className="font-mono text-[0.64rem] tracking-[0.34em] text-[var(--color-ink-faint)] uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.8 }}
            >
              Almachar
            </motion.p>
          </div>
          <div className="relative h-px w-40 overflow-hidden bg-white/10">
            <motion.span
              className="absolute inset-y-0 left-0 bg-[var(--env-accent)]"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <motion.p
            className="font-mono text-[0.64rem] tracking-[0.3em] text-[var(--color-ink-faint)] uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 0.5 }}
          >
            Initializing…
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
