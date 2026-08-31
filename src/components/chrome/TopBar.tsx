import { motion, useMotionValueEvent, useScroll, useSpring } from 'motion/react';
import { useState } from 'react';
import { primeAudio } from '../../audio/ambient';
import { IDENTITY } from '../../data/content';
import { useActions, useAudioOn, useDevice } from '../../state/experience';
import Logo from '../ui/Logo';
import { cn } from '../../lib/utils';

export default function TopBar() {
  const { goTo, toggleAudio, setTerminalOpen } = useActions();
  const audioOn = useAudioOn();
  const { compact } = useDevice();
  const { scrollY, scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 22, mass: 0.4 });
  const [lifted, setLifted] = useState(false);

  useMotionValueEvent(scrollY, 'change', (v) => setLifted(v > 40));

  return (
    <motion.header
      className={cn(
        'fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-4 px-[var(--shell)] transition-all duration-500',
        lifted ? 'py-3' : 'py-5',
      )}
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.8 }}
    >
      {compact && (
        <motion.span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[2px] origin-left bg-[var(--env-accent)]"
          style={{ scaleX: progress }}
        />
      )}

      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 transition-opacity duration-500',
          lifted ? 'opacity-100' : 'opacity-0',
        )}
        style={{
          background: 'linear-gradient(180deg, color-mix(in oklab, var(--env-void) 78%, transparent), transparent)',
          backdropFilter: 'blur(6px)',
          maskImage: 'linear-gradient(180deg, #000 55%, transparent)',
          WebkitMaskImage: 'linear-gradient(180deg, #000 55%, transparent)',
        }}
      />

      <div className="relative z-10 flex items-center gap-3">
        <Logo
          size={lifted ? 34 : 40}
          onClick={() => goTo('home')}
          onSecret={() => setTerminalOpen(true)}
        />
        <button
          type="button"
          onClick={() => goTo('home')}
          className="hidden flex-col leading-none sm:flex"
          aria-label="Back to the top"
        >
          <span className="font-mono text-[0.68rem] tracking-[0.34em] text-[var(--color-ink)] uppercase">
            {IDENTITY.short}
          </span>
          <span className="mt-1 font-mono text-[0.6rem] tracking-[0.28em] text-[var(--env-tint)] uppercase opacity-70">
            Almachar
          </span>
        </button>
      </div>

      <div className="relative z-10 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            // Straight from the gesture, so iOS lets the sound start.
            if (!audioOn) primeAudio();
            toggleAudio();
          }}
          aria-pressed={audioOn}
          className={cn(
            'glass flex items-center gap-2 rounded-full px-3.5 py-2 font-mono text-[0.66rem] tracking-[0.2em] uppercase transition-colors duration-300',
            audioOn ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-dim)]',
          )}
          title={audioOn ? 'Ambient sound on' : 'Ambient sound off (nothing plays until you ask)'}
        >
          <span className="flex h-3 items-end gap-[2px]" aria-hidden="true">
            {[0.5, 1, 0.7].map((s, i) => (
              <motion.span
                key={i}
                className="w-[2px] rounded-full bg-current"
                animate={audioOn ? { height: [`${s * 40}%`, '100%', `${s * 55}%`] } : { height: '28%' }}
                transition={audioOn ? { duration: 0.9 + i * 0.2, repeat: Infinity, repeatType: 'mirror' } : { duration: 0.3 }}
              />
            ))}
          </span>
          <span>Ambient</span>
        </button>

        {!compact && (
          <button
            type="button"
            onClick={() => setTerminalOpen(true)}
            className="glass flex items-center gap-2 rounded-full px-3.5 py-2 font-mono text-[0.66rem] tracking-[0.2em] text-[var(--color-ink-dim)] uppercase transition-colors duration-300 hover:text-[var(--color-ink)]"
            title="Open the terminal (press /)"
          >
            <kbd className="rounded border border-white/15 px-1.5 py-0.5 text-[0.64rem] not-italic">/</kbd>
            <span className="hidden sm:inline">Terminal</span>
          </button>
        )}
      </div>
    </motion.header>
  );
}
