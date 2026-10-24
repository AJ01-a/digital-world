import { useCallback, useRef, useState } from 'react';
import { primeAudio } from '../../audio/ambient';
import { IDENTITY } from '../../data/content';
import { useScrollProgress } from '../../hooks/useScrollProgress';
import { useActions, useAudioOn, useDevice } from '../../state/hooks';
import Logo from '../ui/Logo';
import { cn } from '../../lib/utils';

export default function TopBar() {
  const { goTo, toggleAudio, setTerminalOpen } = useActions();
  const audioOn = useAudioOn();
  const { compact } = useDevice();
  const [lifted, setLifted] = useState(false);
  const bar = useRef<HTMLSpanElement>(null);
  const clicks = useRef({ n: 0, t: 0 });

  useScrollProgress(
    useCallback((p: number, y: number) => {
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      // Only crossing the threshold re-renders.
      setLifted(y > 40);
    }, []),
  );

  /* Five quick clicks on the mark opens the terminal — an old habit. */
  const onMark = () => {
    goTo('home');
    const now = performance.now();
    clicks.current.n = now - clicks.current.t < 1400 ? clicks.current.n + 1 : 1;
    clicks.current.t = now;
    if (clicks.current.n >= 5) {
      clicks.current.n = 0;
      setTerminalOpen(true);
    }
  };

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-4 px-[var(--shell)] transition-[padding] duration-500',
        lifted ? 'py-2.5' : 'py-4 sm:py-5',
      )}
    >
      <span ref={bar} aria-hidden="true" className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0" style={{ background: 'var(--spectrum)' }} />

      <div
        aria-hidden="true"
        className={cn('pointer-events-none absolute inset-0 transition-opacity duration-500', lifted ? 'opacity-100' : 'opacity-0')}
        style={{
          background: 'linear-gradient(180deg, color-mix(in oklab, var(--env-void) 88%, transparent), color-mix(in oklab, var(--env-void) 40%, transparent))',
          borderBottom: '1px solid color-mix(in oklab, var(--env-accent) 10%, transparent)',
        }}
      />

      <button
        type="button"
        onClick={onMark}
        className="group relative z-10 flex items-center gap-3 rounded-lg"
        aria-label={`${IDENTITY.name} — back to the top`}
      >
        <Logo size={lifted || compact ? 34 : 40} detail="compact" className="transition-transform duration-500 group-hover:rotate-[-4deg]" />
        <span className="flex flex-col items-start leading-none">
          <span className="font-sans text-[0.9rem] font-medium tracking-[0.28em] text-[var(--color-ink)]">{IDENTITY.name}</span>
          <span className="mt-1.5 hidden font-mono text-[0.58rem] tracking-[0.3em] text-[var(--env-tint)] uppercase opacity-80 sm:block">
            {IDENTITY.site}
          </span>
        </span>
      </button>

      <div className="relative z-10 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            // Straight from the gesture, so iOS lets the sound start.
            if (!audioOn) primeAudio();
            toggleAudio();
          }}
          aria-pressed={audioOn}
          aria-label={audioOn ? 'Ambient sound: on' : 'Ambient sound: off'}
          className={cn(
            'surface flex h-10 items-center gap-2.5 rounded-full px-3.5 font-mono text-[0.64rem] tracking-[0.2em] uppercase transition-colors duration-300',
            audioOn ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]',
          )}
          title={audioOn ? 'Ambient sound on' : 'Ambient sound off — nothing plays until you ask'}
        >
          <span className="flex h-3 items-end gap-[2px]" aria-hidden="true">
            {[0.45, 1, 0.7].map((s, i) => (
              <span
                key={i}
                className="w-[2px] origin-bottom rounded-full bg-current transition-transform duration-300"
                style={{
                  height: '100%',
                  transform: `scaleY(${audioOn ? s : 0.3})`,
                  animation: audioOn ? `twinkle ${0.7 + i * 0.2}s ease-in-out infinite alternate` : undefined,
                }}
              />
            ))}
          </span>
          <span className="hidden sm:inline">Ambient</span>
        </button>

        {!compact && (
          <button
            type="button"
            onClick={() => setTerminalOpen(true)}
            className="surface flex h-10 items-center gap-2 rounded-full px-3.5 font-mono text-[0.64rem] tracking-[0.2em] text-[var(--color-ink-dim)] uppercase transition-colors duration-300 hover:text-[var(--color-ink)]"
            title="Open the terminal (press /)"
          >
            <kbd className="rounded border border-white/15 px-1.5 py-0.5 text-[0.62rem]">/</kbd>
            <span>Terminal</span>
          </button>
        )}
      </div>
    </header>
  );
}
