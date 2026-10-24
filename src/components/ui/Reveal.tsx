import type { CSSProperties, ReactNode } from 'react';
import { useReveal } from '../../hooks/useInView';
import { cn } from '../../lib/utils';

type Tag = 'div' | 'span' | 'li' | 'p' | 'h2' | 'h3' | 'ul' | 'ol';

/**
 * Fades and lifts its children in the first time they scroll into view.
 * The motion itself is a CSS transition (`.reveal` in index.css), so once it
 * has played there is nothing left running.
 */
export default function Reveal({
  children,
  delay = 0,
  className,
  as: Comp = 'div',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: Tag;
}) {
  const ref = useReveal<HTMLElement>();
  return (
    <Comp ref={ref as never} className={cn('reveal', className)} style={{ '--d': `${delay * 1000}ms` } as CSSProperties}>
      {children}
    </Comp>
  );
}

/**
 * Splits a line into words that rise into place one after another — but
 * observes only the line, not every word.
 */
export function RevealWords({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const ref = useReveal<HTMLSpanElement>();
  return (
    <span ref={ref} className={className} style={{ '--d': `${delay * 1000}ms` } as CSSProperties}>
      {text.split(' ').map((word, i) => (
        <span key={`${word}-${i}`} className="rw">
          <span style={{ '--i': i } as CSSProperties}>
            {word}
            {' '}
          </span>
        </span>
      ))}
    </span>
  );
}
