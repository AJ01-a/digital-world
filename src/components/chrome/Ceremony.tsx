import { useEffect, useState, type CSSProperties } from 'react';
import { useActions, useCeremony, useDevice } from '../../state/hooks';

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
const SPARKS = Array.from({ length: 18 }, (_, i) => {
  const a = (i / 18) * Math.PI * 2;
  const d = 140 + (i % 4) * 50;
  return { x: Math.cos(a) * d, y: Math.sin(a) * d - 40, color: i % 3 === 0 ? '#ff9b52' : i % 3 === 1 ? '#f4f6fb' : '#ff3444' };
});

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

  useEffect(() => {
    if (!burst) return;
    const t = window.setTimeout(() => setBurst(0), 1600);
    return () => window.clearTimeout(t);
  }, [burst]);

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-[max(5rem,11vh)] z-50 flex justify-center px-4" role="status" aria-live="polite">
        {ceremony && (
          <div key={ceremony} className="surface flex items-center gap-3 rounded-full px-6 py-3" style={{ animation: 'pop-in 420ms var(--ease-out-expo) both', background: 'color-mix(in oklab, var(--env-void) 92%, transparent)' }}>
            <span aria-hidden="true" className="h-1.5 w-1.5 rotate-45 bg-[var(--env-accent)] shadow-[0_0_12px_var(--env-accent)]" />
            <p className="text-center text-[0.95rem] text-[var(--color-ink)]">{ceremony}</p>
          </div>
        )}
      </div>

      {burst > 0 && !reducedMotion && (
        <div key={burst} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[55] grid place-items-center">
          {SPARKS.map((s, i) => (
            <span
              key={i}
              className="absolute h-1.5 w-1.5 rounded-full"
              style={
                {
                  background: s.color,
                  boxShadow: `0 0 10px ${s.color}`,
                  animation: 'spark 1.3s var(--ease-out-expo) both',
                  '--sx': `${s.x}px`,
                  '--sy': `${s.y}px`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}
    </>
  );
}
