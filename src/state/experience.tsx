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

export interface EnvOverride {
  theme: Theme;
  particles: ParticleMode;
}

interface ExperienceValue {
  active: SceneId;
  goTo: (id: SceneId) => void;
  register: (id: SceneId, el: HTMLElement | null) => void;
  /** A game world temporarily taking over the environment. */
  override: EnvOverride | null;
  setOverride: (o: EnvOverride | null) => void;
  theme: Theme;
  particles: ParticleMode;
  audioOn: boolean;
  toggleAudio: () => void;
  terminalOpen: boolean;
  setTerminalOpen: (v: boolean) => void;
  reducedMotion: boolean;
  compact: boolean;
  /** 0 = decorative motion off, 1 = full effects. */
  intensity: number;
  ceremony: string | null;
  celebrate: (label: string) => void;
}

const Ctx = createContext<ExperienceValue | null>(null);

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
        if (best && bestRatio > 0.02) setActive(best);
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
      el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    },
    [reducedMotion],
  );

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

  const toggleAudio = useCallback(() => setAudioOn((v) => !v), []);

  const celebrate = useCallback((label: string) => {
    setCeremony(label);
    window.setTimeout(() => setCeremony((c) => (c === label ? null : c)), 2800);
  }, []);

  const value = useMemo<ExperienceValue>(
    () => ({
      active,
      goTo,
      register,
      override,
      setOverride,
      theme,
      particles,
      audioOn,
      toggleAudio,
      terminalOpen,
      setTerminalOpen,
      reducedMotion,
      compact,
      intensity,
      ceremony,
      celebrate,
    }),
    [active, goTo, register, override, theme, particles, audioOn, toggleAudio, terminalOpen, reducedMotion, compact, intensity, ceremony, celebrate],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useExperience() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useExperience must be used inside <ExperienceProvider>');
  return ctx;
}
