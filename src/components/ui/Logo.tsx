import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

interface LogoProps {
  size?: number;
  className?: string;
  /** Draw-in animation on first paint. */
  animate?: boolean;
  onSecret?: () => void;
  onClick?: () => void;
  /** Accessible name when the mark itself is the button. */
  label?: string;
  interactive?: boolean;
}

/**
 * The AJ mark. Strokes are drawn on mount, the ring rotates slowly, and the
 * whole thing tilts a little toward the pointer. Colour comes from the active
 * environment, so it re-tints itself as you move through the site.
 */
export default function Logo({ size = 44, className, animate = true, onSecret, onClick, label, interactive = true }: LogoProps) {
  const clicks = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  const [pulse, setPulse] = useState(0);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, (v) => v * -14), { stiffness: 120, damping: 14 });
  const ry = useSpring(useTransform(mx, (v) => v * 14), { stiffness: 120, damping: 14 });

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onMove = (e: React.PointerEvent) => {
    if (!interactive) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  const handleClick = () => {
    onClick?.();
    if (!onSecret) return;
    clicks.current += 1;
    setPulse((p) => p + 1);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => (clicks.current = 0), 1400);
    if (clicks.current >= 5) {
      clicks.current = 0;
      onSecret();
    }
  };

  const stroke = { stroke: 'var(--env-accent)', strokeWidth: 5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  const draw = animate
    ? { initial: { pathLength: 0, opacity: 0 }, animate: { pathLength: 1, opacity: 1 } }
    : {};

  const isButton = Boolean(onSecret || onClick);
  const Tag = isButton ? motion.button : motion.div;

  return (
    <Tag
      className={cn('relative grid place-items-center', isButton && 'cursor-pointer', className)}
      style={{ width: size, height: size, perspective: 400, background: 'none', border: 0, padding: 0 }}
      onPointerMove={onMove}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      onClick={isButton ? handleClick : undefined}
      aria-label={isButton ? (label ?? 'AJ — back to the top') : undefined}
      whileTap={isButton ? { scale: 0.94 } : undefined}
    >
      <motion.svg
        viewBox="0 0 96 96"
        width={size}
        height={size}
        style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d', overflow: 'visible' }}
      >
        <defs>
          <filter id="aj-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <motion.circle
          cx="48"
          cy="48"
          r="44"
          fill="none"
          stroke="var(--env-accent)"
          strokeOpacity="0.28"
          strokeWidth="1.2"
          strokeDasharray="3 9"
          animate={{ rotate: 360 }}
          transition={{ duration: 42, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '48px 48px' }}
        />
        <motion.circle
          cx="48"
          cy="48"
          r="37"
          fill="none"
          stroke="var(--env-accent)"
          strokeOpacity="0.14"
          strokeWidth="1"
          animate={{ scale: [1, 1.045, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '48px 48px' }}
        />

        <g filter="url(#aj-glow)">
          <motion.path d="M22 68 L34 28 L46 68" {...stroke} {...draw} transition={{ duration: 1.1, delay: 0.15, ease: 'easeInOut' }} />
          <motion.path d="M27 56 H41" {...stroke} {...draw} transition={{ duration: 0.5, delay: 0.9, ease: 'easeInOut' }} />
          <motion.path d="M56 28 H76" {...stroke} {...draw} transition={{ duration: 0.5, delay: 0.5, ease: 'easeInOut' }} />
          <motion.path d="M69 28 V57 C69 66 62 70 54 67" {...stroke} {...draw} transition={{ duration: 1, delay: 0.7, ease: 'easeInOut' }} />
        </g>

        {pulse > 0 && (
          <motion.circle
            key={pulse}
            cx="48"
            cy="48"
            r="40"
            fill="none"
            stroke="var(--env-accent)"
            initial={{ opacity: 0.5, scale: 0.9 }}
            animate={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ transformOrigin: '48px 48px' }}
          />
        )}
      </motion.svg>
    </Tag>
  );
}
