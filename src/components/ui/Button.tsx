import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { cn } from '../../lib/utils';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'solid' | 'ghost' | 'quiet';
  ref?: Ref<HTMLButtonElement>;
}

/** The house button. Styling and the hover sweep live in index.css (`.btn`). */
export default function Button({ children, variant = 'ghost', className, type = 'button', ...rest }: Props) {
  return (
    <button type={type} className={cn('btn', `btn-${variant}`, className)} {...rest}>
      {children}
    </button>
  );
}

export function Arrow({ dir = 'right' }: { dir?: 'right' | 'left' | 'down' | 'up' }) {
  const rotate = dir === 'left' ? 180 : dir === 'down' ? 90 : dir === 'up' ? -90 : 0;
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" style={{ transform: `rotate(${rotate}deg)` }}>
      <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
