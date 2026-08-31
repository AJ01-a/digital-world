import { motion, useMotionValue, useSpring } from 'motion/react';
import { useEffect, useState } from 'react';
import { useFinePointer, useReducedMotion } from '../../hooks/useMediaQuery';

const INTERACTIVE = 'a, button, [role="button"], input, textarea, select, [data-magnetic], [role="gridcell"]';

/** A small, quiet cursor: a dot you barely notice and a ring that lags. */
export default function Cursor() {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const [hot, setHot] = useState(false);
  const [down, setDown] = useState(false);
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const rx = useSpring(x, { stiffness: 380, damping: 34, mass: 0.35 });
  const ry = useSpring(y, { stiffness: 380, damping: 34, mass: 0.35 });

  useEffect(() => {
    if (!fine || reduced) return;
    document.body.dataset.cursor = 'custom';
    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      const el = e.target as HTMLElement | null;
      setHot(Boolean(el?.closest(INTERACTIVE)));
    };
    const onDown = () => setDown(true);
    const onUp = () => setDown(false);
    const onLeave = () => setVisible(false);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    document.addEventListener('pointerleave', onLeave);
    return () => {
      delete document.body.dataset.cursor;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, [fine, reduced, x, y]);

  if (!fine || reduced) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60]" style={{ opacity: visible ? 1 : 0, transition: 'opacity 200ms' }}>
      <motion.span
        className="absolute h-1.5 w-1.5 rounded-full bg-[var(--env-accent)]"
        style={{ x, y, translateX: '-50%', translateY: '-50%', boxShadow: '0 0 12px var(--env-accent)' }}
      />
      <motion.span
        className="absolute rounded-full border"
        style={{
          x: rx,
          y: ry,
          translateX: '-50%',
          translateY: '-50%',
          borderColor: 'color-mix(in oklab, var(--env-accent) 55%, transparent)',
        }}
        animate={{
          width: hot ? 46 : 26,
          height: hot ? 46 : 26,
          opacity: hot ? 0.9 : 0.5,
          scale: down ? 0.86 : 1,
          backgroundColor: hot ? 'color-mix(in oklab, var(--env-accent) 10%, transparent)' : 'transparent',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      />
    </div>
  );
}
