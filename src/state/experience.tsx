import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { SCENE_MAP, SCENES, type SceneId } from '../data/worlds';
import { useFinePointer, useIsCompact, useReducedMotion } from '../hooks/useMediaQuery';
import { scrollToSection } from '../lib/utils';
import {
  ActionsCtx,
  AudioCtx,
  CeremonyCtx,
  CloverCtx,
  DeviceCtx,
  EnvCtx,
  TerminalCtx,
  type ActionsValue,
  type CloverValue,
  type DeviceValue,
  type EnvOverride,
  type EnvValue,
} from './contexts';

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<SceneId>('home');
  const [worldOverride, setOverride] = useState<EnvOverride | null>(null);
  const [audioOn, setAudioOn] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [ceremony, setCeremony] = useState<string | null>(null);
  const [clover, setClover] = useState<CloverValue>({ open: false, pending: null, nonce: 0 });

  const reducedMotion = useReducedMotion();
  const compact = useIsCompact();
  const finePointer = useFinePointer();

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
      { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1], rootMargin: '-10% 0px -10% 0px' },
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

  const ceremonyTimer = useRef<number | undefined>(undefined);
  const celebrate = useCallback((label: string) => {
    setCeremony(label);
    window.clearTimeout(ceremonyTimer.current);
    ceremonyTimer.current = window.setTimeout(() => setCeremony(null), 2800);
  }, []);
  useEffect(() => () => window.clearTimeout(ceremonyTimer.current), []);

  const openClover = useCallback((ask?: string) => {
    setClover((c) => ({ open: true, pending: ask ?? null, nonce: c.nonce + 1 }));
  }, []);
  const closeClover = useCallback(() => setClover((c) => ({ ...c, open: false, pending: null })), []);

  const scene = SCENE_MAP[active];
  /* A game world only owns the environment while the Games section is on
     screen — leaving the section hands the environment straight back. */
  const override = active === 'games' ? worldOverride : null;
  const theme = override?.theme ?? scene.theme;
  const scape = override?.scape ?? scene.scape;

  /* Only the browser chrome colour follows the chapter here. Page content
     carries its own palette per section (SectionShell), and the floating UI
     reads the active one from <ChromeEnv> — nothing touches :root, because
     changing an inherited property there restyles every element on the page. */
  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.void);
  }, [theme]);

  const env = useMemo<EnvValue>(() => ({ active, theme, scape }), [active, theme, scape]);
  const device = useMemo<DeviceValue>(() => ({ reducedMotion, compact, finePointer }), [reducedMotion, compact, finePointer]);
  const actions = useMemo<ActionsValue>(
    () => ({ goTo, register, setOverride, setTerminalOpen, toggleAudio, celebrate, openClover, closeClover }),
    [goTo, register, toggleAudio, celebrate, openClover, closeClover],
  );

  return (
    <ActionsCtx.Provider value={actions}>
      <DeviceCtx.Provider value={device}>
        <AudioCtx.Provider value={audioOn}>
          <TerminalCtx.Provider value={terminalOpen}>
            <CeremonyCtx.Provider value={ceremony}>
              <CloverCtx.Provider value={clover}>
                <EnvCtx.Provider value={env}>{children}</EnvCtx.Provider>
              </CloverCtx.Provider>
            </CeremonyCtx.Provider>
          </TerminalCtx.Provider>
        </AudioCtx.Provider>
      </DeviceCtx.Provider>
    </ActionsCtx.Provider>
  );
}
