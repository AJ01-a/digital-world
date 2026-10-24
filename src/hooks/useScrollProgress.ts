import { useEffect } from 'react';

/**
 * Calls `onFrame` with page scroll progress (0–1) at most once per frame.
 * Callers write straight to the DOM — no React state, no re-render per scroll.
 */
export function useScrollProgress(onFrame: (progress: number, y: number) => void) {
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      onFrame(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0, window.scrollY);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [onFrame]);
}
