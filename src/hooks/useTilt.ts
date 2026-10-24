import { useCallback, useRef } from 'react';
import { useFinePointer } from './useMediaQuery';

/**
 * Pointer-driven 3D tilt for cards. Writes straight to the element's style
 * once per frame — no React state, no spring loop left running afterwards.
 * The easing back to rest is a plain CSS transition.
 */
export function useTilt<T extends HTMLElement>(max = 7) {
  const fine = useFinePointer();
  const raf = useRef(0);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<T>) => {
      if (!fine) return;
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        el.style.setProperty('--rx', `${(-py * max).toFixed(2)}deg`);
        el.style.setProperty('--ry', `${(px * max).toFixed(2)}deg`);
        el.style.setProperty('--gx', `${((px + 0.5) * 100).toFixed(1)}%`);
        el.style.setProperty('--gy', `${((py + 0.5) * 100).toFixed(1)}%`);
      });
    },
    [fine, max],
  );

  const onPointerLeave = useCallback((e: React.PointerEvent<T>) => {
    cancelAnimationFrame(raf.current);
    const s = e.currentTarget.style;
    s.setProperty('--rx', '0deg');
    s.setProperty('--ry', '0deg');
  }, []);

  return { onPointerMove, onPointerLeave, enabled: fine };
}
