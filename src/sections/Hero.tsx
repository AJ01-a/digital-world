import { motion } from 'motion/react';
import { IDENTITY } from '../data/content';
import { useActions } from '../state/experience';
import MagneticButton from '../components/ui/MagneticButton';
import SectionShell from '../components/ui/SectionShell';
import { useReducedMotion } from '../hooks/useMediaQuery';

export default function Hero() {
  const { goTo } = useActions();
  const reduced = useReducedMotion();

  return (
    <SectionShell id="home" header={false} align="center" className="items-center text-center">
      <div className="relative mx-auto flex max-w-[900px] flex-col items-center">
        <motion.p
          className="eyebrow mb-7 [@media(max-height:560px)]:mb-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.9 }}
        >
          Personal site · Est. curiosity
        </motion.p>

        <h1 id="hero-title" className="sr-only">
          AJ Almachar — personal website
        </h1>

        <div aria-hidden="true" className="relative">
          <div className="flex justify-center">
            {'AJ'.split('').map((ch, i) => (
              <motion.span
                key={ch}
                className="inline-block text-[clamp(3.4rem,min(15vw,26svh),10.5rem)] leading-[0.86] font-light tracking-[0.02em] text-[var(--color-ink)]"
                initial={reduced ? undefined : { opacity: 0, y: '0.4em', filter: 'blur(16px)' }}
                animate={reduced ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ delay: 0.3 + i * 0.12, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              >
                {ch}
              </motion.span>
            ))}
          </div>
          <div className="mt-3 flex justify-center sm:mt-5 [@media(max-height:560px)]:mt-2">
            {'ALMACHAR'.split('').map((ch, i) => (
              <motion.span
                key={`${ch}-${i}`}
                className="inline-block text-[clamp(0.85rem,min(3.4vw,5svh),1.9rem)] font-light tracking-[0.42em] text-[color-mix(in_oklab,var(--color-ink)_78%,var(--env-tint))]"
                initial={reduced ? undefined : { opacity: 0, y: 12 }}
                animate={reduced ? undefined : { opacity: 1, y: 0 }}
                transition={{ delay: 0.75 + i * 0.05, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              >
                {ch}
              </motion.span>
            ))}
          </div>
          {/* A single slow light sweep across the wordmark. */}
          {!reduced && (
            <motion.span
              className="pointer-events-none absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0], x: ['-40%', '40%'] }}
              transition={{ delay: 1.5, duration: 2.4, ease: 'easeInOut' }}
              style={{
                background: 'linear-gradient(100deg, transparent 42%, color-mix(in oklab, var(--env-accent) 55%, white) 50%, transparent 58%)',
                mixBlendMode: 'overlay',
              }}
            />
          )}
        </div>

        <motion.div
          className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 [@media(max-height:560px)]:mt-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.05, duration: 1 }}
        >
          {IDENTITY.keywords.map((k, i) => (
            <span key={k} className="flex items-center gap-4">
              {i > 0 && <span className="h-1 w-1 rounded-full bg-[var(--env-accent)] opacity-60" />}
              <span className="font-mono text-[0.68rem] tracking-[0.32em] text-[var(--env-tint)] uppercase">{k}</span>
            </span>
          ))}
        </motion.div>

        <motion.p
          className="mt-9 [@media(max-height:560px)]:mt-3 max-w-[34ch] text-[clamp(1.05rem,min(1rem+0.6vw,3.6svh),1.5rem)] leading-relaxed text-[color-mix(in_oklab,var(--color-ink)_80%,var(--env-tint))] italic"
          style={{ fontFamily: 'var(--font-display)' }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.25, duration: 1 }}
        >
          “{IDENTITY.greeting}”
        </motion.p>

        <motion.div
          className="mt-12 flex flex-col items-center gap-5 sm:flex-row [@media(max-height:560px)]:mt-5"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.45, duration: 0.9 }}
        >
          <MagneticButton variant="solid" onClick={() => goTo('about')}>
            {IDENTITY.enter}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </MagneticButton>
          <MagneticButton variant="quiet" onClick={() => goTo('games')}>
            Skip to the games
          </MagneticButton>
        </motion.div>
      </div>

      <motion.div
        className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-3 [@media(max-height:560px)]:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1.2 }}
        aria-hidden="true"
      >
        <span className="font-mono text-[0.68rem] tracking-[0.32em] text-[var(--env-tint)] uppercase opacity-70">
          Scroll
        </span>
        <span className="relative h-12 w-px overflow-hidden bg-[color-mix(in_oklab,var(--env-accent)_20%,transparent)]">
          <motion.span
            className="absolute inset-x-0 h-4 bg-[var(--env-accent)]"
            animate={reduced ? undefined : { y: ['-100%', '300%'] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </span>
      </motion.div>
    </SectionShell>
  );
}
