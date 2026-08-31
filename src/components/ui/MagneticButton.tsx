import { motion, useMotionValue, useSpring } from 'motion/react';
import type { ReactNode } from 'react';
import { useFinePointer } from '../../hooks/useMediaQuery';
import { cn } from '../../lib/utils';

interface Props {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'solid' | 'ghost' | 'quiet';
  strength?: number;
  ariaLabel?: string;
  type?: 'button' | 'submit';
}

/** A button that leans very slightly toward the pointer. */
export default function MagneticButton({
  children,
  onClick,
  className,
  variant = 'ghost',
  strength = 12,
  ariaLabel,
  type = 'button',
}: Props) {
  const fine = useFinePointer();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });

  const onMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!fine) return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set(((e.clientX - r.left) / r.width - 0.5) * strength * 2);
    y.set(((e.clientY - r.top) / r.height - 0.5) * strength * 1.4);
  };

  const styles = {
    solid:
      'text-[#07080d] bg-[color-mix(in_oklab,var(--env-accent)_88%,white)] hover:bg-[var(--env-accent)] shadow-[0_10px_40px_-12px_var(--env-accent)]',
    ghost:
      'text-[var(--color-ink)] border border-[color-mix(in_oklab,var(--env-accent)_34%,transparent)] bg-[color-mix(in_oklab,var(--env-void)_55%,transparent)] backdrop-blur-md hover:border-[color-mix(in_oklab,var(--env-accent)_75%,transparent)] hover:bg-[color-mix(in_oklab,var(--env-accent)_12%,transparent)]',
    quiet: 'text-[var(--env-tint)] hover:text-[var(--color-ink)]',
  }[variant];

  return (
    <motion.button
      type={type}
      aria-label={ariaLabel}
      onClick={onClick}
      onPointerMove={onMove}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{ x: sx, y: sy }}
      whileTap={{ scale: 0.97 }}
      data-magnetic
      className={cn(
        'group relative inline-flex items-center gap-3 overflow-hidden rounded-full px-6 py-3',
        'font-mono text-[0.7rem] tracking-[0.24em] uppercase transition-colors duration-300',
        styles,
        className,
      )}
    >
      <span className="relative z-10 flex items-center gap-3">{children}</span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-full opacity-0 transition-none group-hover:animate-[sheen_0.9s_ease-out] group-hover:opacity-100"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)' }}
      />
    </motion.button>
  );
}
