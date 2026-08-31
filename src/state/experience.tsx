import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { SCENE_MAP, SCENES, type ParticleMode, type SceneId, type Theme } from '../data/worlds';
import { useIsCompact, useReducedMotion } from '../hooks/useMediaQuery';
import { scrollToSection } from '../lib/utils';

export interface EnvOverride {
  theme: Theme;
  particles: ParticleMode;
}

/**
 * State is split across several small contexts on purpose.
 *
 * With one context, every scroll that changed the active chapter re-rendered
 * the entire page — around 800ms of scripting on a mid-range phone, which is
 * exactly the stutter you feel during a world transition. Now a scene change
 * only re-renders the things that actually depend on the scene.
 */
interface EnvValue {
  active: SceneId;
  theme: Theme;
  particles: ParticleMode;
  override: EnvOverride | null;
}

interface DeviceValue {
  reducedMotion: boolean;
  compact: boolean;
  /** 0 = decorative motion off, 1 = full effects. */
  intensity: number;
}

interface ActionsValue {
  goTo: (id: SceneId) => void;
  register: (id: SceneId, el: HTMLElement | null) => void;
  setOverride: (o: EnvOverride | null) => void;
  setTerminalOpen: (v: boolean) => void;
  toggleAudio: () => void;
  celebrate: (label: string) => void;
}

const EnvCtx = createContext<EnvValue | null>(null);
const DeviceCtx = createContext<DeviceValue | null>(null);
const ActionsCtx = createContext<ActionsValue | null>(null);
const AudioCtx = createContext<boolean>(false);
const TerminalCtx = createContext<boolean>(false);
const CeremonyCtx = createContext<string | null>(null);

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<SceneId>('home');
  const [worldOverride, setOverride] = useState<EnvOverride | null>(null);
  const [audioOn, setAudioOn] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [ceremony, setCeremony] = useState<string | null>(null);

  const reducedMotion = useReducedMotion();
  const compact = useIsCompact();
  const intensity = reducedMotion ? 0 : compact ? 0.45 : 1;

  const nodes = useRef(new Map<SceneId, HTMLElement>());
  const ratios = useRef(new Map<SceneId, number>());
  const observer = useRef<IntersectionObserver | null>(null);

  const ensureObserver = () => {
    if (observer.current || typeof IntersectionObserver === 'undefined') return observer.current;
    observer.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.getAttribute('data-scene') as SceneId | null;
          if (id) ratios.current.set(id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }
        let best: SceneId | null = null;
        let bestRatio = 0;
        for (const scene of SCENES) {
          const r = ratios.current.get(scene.id) ?? 0;
          if (r > bestRatio + 0.001) {
            bestRatio = r;
            best = scene.id;
          }
        }
        if (best && bestRatio > 0.02) setActive((current) => (current === best ? current : best));
      },
      { threshold: [0, 0.08, 0.2, 0.35, 0.5, 0.7, 0.9, 1], rootMargin: '-10% 0px -10% 0px' },
    );
    return observer.current;
  };

  const register = useCallback((id: SceneId, el: HTMLElement | null) => {
    const obs = ensureObserver();
    const existing = nodes.current.get(id);
    if (existing && obs) obs.unobserve(existing);
    if (el) {
      nodes.current.set(id, el);
      obs?.observe(el);
    } else {
      nodes.current.delete(id);
      ratios.current.delete(id);
    }
  }, []);

  useEffect(() => {
    const obs = observer.current;
    return () => obs?.disconnect();
  }, []);

  const goTo = useCallback(
    (id: SceneId) => {
      const el = nodes.current.get(id);
      if (!el) return;
      // Clicking a button focuses it, and the browser scrolls focused elements
      // into view — which lands short of the target. Running a frame later
      // lets that happen first, so this scroll is the one that sticks.
      requestAnimationFrame(() => scrollToSection(el, !reducedMotion));
    },
    [reducedMotion],
  );

  const toggleAudio = useCallback(() => setAudioOn((v) => !v), []);

  const celebrate = useCallback((label: string) => {
    setCeremony(label);
    window.setTimeout(() => setCeremony((c) => (c === label ? null : c)), 2800);
  }, []);

  const scene = SCENE_MAP[active];
  /* A game world only owns the environment while the Games section is on
     screen — leaving the section hands the environment straight back. */
  const override = active === 'games' ? worldOverride : null;
  const theme = override?.theme ?? scene.theme;
  const particles = override?.particles ?? scene.particles;

  /* Paint the environment onto the document. The properties are registered
     with @property, so every change cross-fades instead of snapping. */
  useEffect(() => {
    const s = document.documentElement.style;
    s.setProperty('--env-void', theme.void);
    s.setProperty('--env-a', theme.a);
    s.setProperty('--env-b', theme.b);
    s.setProperty('--env-accent', theme.accent);
    s.setProperty('--env-tint', theme.tint);
    s.setProperty('--env-ray', theme.ray);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.void);
  }, [theme]);

  const env = useMemo<EnvValue>(() => ({ active, theme, particles, override }), [active, theme, particles, override]);
  const device = useMemo<DeviceValue>(() => ({ reducedMotion, compact, intensity }), [reducedMotion, compact, intensity]);
  const actions = useMemo<ActionsValue>(
    () => ({ goTo, register, setOverride, setTerminalOpen, toggleAudio, celebrate }),
    [goTo, register, toggleAudio, celebrate],
  );

  return (
    <ActionsCtx.Provider value={actions}>
      <DeviceCtx.Provider value={device}>
        <AudioCtx.Provider value={audioOn}>
          <TerminalCtx.Provider value={terminalOpen}>
            <CeremonyCtx.Provider value={ceremony}>
              <EnvCtx.Provider value={env}>{children}</EnvCtx.Provider>
            </CeremonyCtx.Provider>
          </TerminalCtx.Provider>
        </AudioCtx.Provider>
      </DeviceCtx.Provider>
    </ActionsCtx.Provider>
  );
}

const missing = (what: string) => {
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
