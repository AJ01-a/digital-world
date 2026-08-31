import { useMotionValue, useSpring, useTransform } from 'motion/react';
import { useFinePointer } from './useMediaQuery';

/** Pointer-driven 3D tilt for cards. Disabled on touch. */
export function useTilt(max = 8) {
  const fine = useFinePointer();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spring = { stiffness: 180, damping: 20, mass: 0.5 };
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [max, -max]), spring);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-max, max]), spring);
  const glareX = useTransform(px, [-0.5, 0.5], ['15%', '85%']);
  const glareY = useTransform(py, [-0.5, 0.5], ['10%', '90%']);

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!fine) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onPointerLeave = () => {
    px.set(0);
    py.set(0);
  };

  return { rotateX, rotateY, glareX, glareY, onPointerMove, onPointerLeave, enabled: fine };
}
