import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../../lib/utils';

/** The house glass surface. Used for every raised element on the page. */
export default function Panel({
  children,
  className,
  style,
  hoverable = false,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  hoverable?: boolean;
}) {
  return (
    <div
      data-panel
      style={style}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-[color-mix(in_oklab,var(--env-accent)_16%,transparent)]',
        // Phones skip the backdrop blur: it is snapshotted every scrolled frame.
        'bg-[color-mix(in_oklab,var(--env-void)_78%,transparent)] md:bg-[color-mix(in_oklab,var(--env-void)_58%,transparent)] md:backdrop-blur-xl',
        'shadow-[0_24px_70px_-40px_rgba(0,0,0,0.9)]',
        hoverable &&
          'transition-colors duration-500 hover:border-[color-mix(in_oklab,var(--env-accent)_38%,transparent)]',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, color-mix(in oklab, var(--env-accent) 55%, transparent), transparent)' }}
      />
      {children}
    </div>
  );
}
