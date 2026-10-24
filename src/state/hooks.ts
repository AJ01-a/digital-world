import { useContext } from 'react';
import { ActionsCtx, AudioCtx, CeremonyCtx, CloverCtx, DeviceCtx, EnvCtx, TerminalCtx } from './contexts';

const missing = (what: string): never => {
  throw new Error(`${what} must be used inside <ExperienceProvider>`);
};

/** The current chapter and its environment. Re-renders on every scene change. */
export function useEnv() {
  return useContext(EnvCtx) ?? missing('useEnv');
}

/** Device capabilities. Effectively constant for a visit. */
export function useDevice() {
  return useContext(DeviceCtx) ?? missing('useDevice');
}

/** Stable callbacks — subscribing to these never causes a re-render. */
export function useActions() {
  return useContext(ActionsCtx) ?? missing('useActions');
}

export const useAudioOn = () => useContext(AudioCtx);
export const useTerminalOpen = () => useContext(TerminalCtx);
export const useCeremony = () => useContext(CeremonyCtx);
export const useClover = () => useContext(CloverCtx);
