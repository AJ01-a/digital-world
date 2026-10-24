import type { CSSProperties } from 'react';
import type { Theme } from '../data/worlds';

/** A chapter palette as the custom properties every component reads. */
export const themeVars = (theme: Theme) =>
  ({
    '--env-void': theme.void,
    '--env-a': theme.a,
    '--env-b': theme.b,
    '--env-accent': theme.accent,
    '--env-tint': theme.tint,
    '--env-ray': theme.ray,
  }) as CSSProperties;
