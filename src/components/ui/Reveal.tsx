import { motion, type Variants } from 'motion/react';
import type { ReactNode } from 'react';
import { useReducedMotion } from '../../hooks/useMediaQuery';

const variants: Variants = {
  hidden: (d: number) => ({ opacity: 0, y: 26, filter: 'blur(6px)', transition: { delay: d } }),
  shown: (d: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.85, delay: d, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function Reveal({
  children,
  delay = 0,
  className,
  as = 'div',
  amount = 0.25,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'span' | 'li' | 'p' | 'h2' | 'h3';
  amount?: number;
}) {
  const reduced = useReducedMotion();
  const Comp = motion[as];
  if (reduced) return <Comp className={className}>{children}</Comp>;
  return (
    <Comp
      className={className}
      custom={delay}
      variants={variants}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount }}
    >
      {children}
    </Comp>
  );
}

/** Splits a line into words that rise into place one after another. */
export function RevealWords({
  text,
  className,
  delay = 0,
  step = 0.055,
}: {
  text: string;
  className?: string;
  delay?: number;
  step?: number;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <span className={className}>{text}</span>;
  return (
    <span className={className}>
      {text.split(' ').map((word, i) => (
        // The mask is what gets observed: the word inside it starts fully
        // clipped, so observing the word itself would never intersect.
        <motion.span
          key={`${word}-${i}`}
          className="inline-block overflow-hidden align-bottom"
          initial="hidden"
          whileInView="shown"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.span
            className="inline-block"
            variants={{ hidden: { y: '115%', opacity: 0 }, shown: { y: '0%', opacity: 1 } }}
            transition={{ duration: 0.9, delay: delay + i * step, ease: [0.16, 1, 0.3, 1] }}
          >
            {word}
            {'\u00A0'}
          </motion.span>
        </motion.span>
      ))}
    </span>
  );
}
