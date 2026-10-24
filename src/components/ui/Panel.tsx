import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../../lib/utils';

/**
 * The house surface. `brackets` adds precision corner marks — kept for
 * feature panels so they still read as special.
 */
export default function Panel({
  children,
  className,
  style,
  brackets = false,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  brackets?: boolean;
}) {
  return (
    <div style={style} className={cn('surface surface-blur', brackets && 'brackets', className)}>
      {children}
    </div>
  );
}
