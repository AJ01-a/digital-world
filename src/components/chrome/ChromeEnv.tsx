import type { ReactNode } from 'react';
import { themeVars } from '../../lib/theme';
import { useEnv } from '../../state/hooks';

/**
 * The floating UI (top bar, rail, Clover, toasts) follows whichever chapter
 * is active. Scoping the palette to this wrapper means a chapter change
 * restyles a few dozen elements instead of the whole document.
 * `display: contents` keeps it out of layout; custom properties still inherit.
 */
export default function ChromeEnv({ children }: { children: ReactNode }) {
  const { theme } = useEnv();
  return <div style={{ display: 'contents', ...themeVars(theme) }}>{children}</div>;
}
