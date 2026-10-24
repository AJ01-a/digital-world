import { createContext } from 'react';
import type { ScapeKey, SceneId, Theme } from '../data/worlds';

export interface EnvOverride {
  theme: Theme;
  scape: ScapeKey;
}

/**
 * State is split across several small contexts on purpose: a scene change
 * should only re-render the things that depend on the scene, not the chess
 * board, the word grid and everything else on the page.
 */
export interface EnvValue {
  active: SceneId;
  theme: Theme;
  scape: ScapeKey;
}

export interface DeviceValue {
  reducedMotion: boolean;
  compact: boolean;
  finePointer: boolean;
}

export interface CloverValue {
  open: boolean;
  /** A question queued from elsewhere on the page, answered when the panel opens. */
  pending: string | null;
  /** Bumped every time something asks, so the same question can be asked twice. */
  nonce: number;
}

export interface ActionsValue {
  goTo: (id: SceneId) => void;
  register: (id: SceneId, el: HTMLElement | null) => void;
  setOverride: (o: EnvOverride | null) => void;
  setTerminalOpen: (v: boolean) => void;
  toggleAudio: () => void;
  celebrate: (label: string) => void;
  openClover: (ask?: string) => void;
  closeClover: () => void;
}

export const EnvCtx = createContext<EnvValue | null>(null);
export const DeviceCtx = createContext<DeviceValue | null>(null);
export const ActionsCtx = createContext<ActionsValue | null>(null);
export const AudioCtx = createContext<boolean>(false);
export const TerminalCtx = createContext<boolean>(false);
export const CeremonyCtx = createContext<string | null>(null);
export const CloverCtx = createContext<CloverValue>({ open: false, pending: null, nonce: 0 });
