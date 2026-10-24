import { useCallback, useEffect, useState } from 'react';
import { useAmbient } from './audio/ambient';
import Ceremony from './components/chrome/Ceremony';
import ChromeEnv from './components/chrome/ChromeEnv';
import Intro from './components/chrome/Intro';
import NavRail from './components/chrome/NavRail';
import SecretTerminal from './components/chrome/SecretTerminal';
import TopBar from './components/chrome/TopBar';
import Clover from './clover/Clover';
import BackgroundStage from './effects/BackgroundStage';
import About from './sections/About';
import Automation from './sections/Automation';
import CloverSection from './sections/CloverSection';
import Driving from './sections/Driving';
import Games from './sections/Games';
import Hero from './sections/Hero';
import Omarchy from './sections/Omarchy';
import Outro from './sections/Outro';
import Projects from './sections/Projects';
import Strategy from './sections/Strategy';
import Tech from './sections/Tech';
import Words from './sections/Words';
import { shouldPlayIntro } from './lib/intro';
import { scrollToSection } from './lib/utils';
import { ExperienceProvider } from './state/experience';
import { useAudioOn, useEnv } from './state/hooks';

function Ambient() {
  const audioOn = useAudioOn();
  const { active } = useEnv();
  useAmbient(audioOn, active);
  return null;
}

/** Old links pointed at #dog; the chapter is Clover's now. */
const ALIASES: Record<string, string> = { dog: 'clover' };

function Experience() {
  // Decided once, on first render: the intro never replays mid-visit.
  const [playIntro] = useState(shouldPlayIntro);
  const [introDone, setIntroDone] = useState(!playIntro);
  const finishIntro = useCallback(() => setIntroDone(true), []);
  /*
   * The page underneath the intro:
   *   covered  — built but not rendered, while the intro's sequence plays;
   *   behind   — rendered, animations paused, once the intro is waiting
   *              (or a hold begins), so the way in has nothing left to lay out;
   *   arriving — the intro is opening onto it: the hero makes its entrance.
   */
  const [page, setPage] = useState<'covered' | 'behind' | 'arriving'>(playIntro ? 'covered' : 'arriving');
  const prepare = useCallback(() => setPage((p) => (p === 'covered' ? 'behind' : p)), []);
  const arrive = useCallback(() => setPage('arriving'), []);

  /* The page is rendered underneath the intro from the start, so content is
     never waiting on an animation. Follow a deep link once it can scroll. */
  useEffect(() => {
    const raw = window.location.hash.slice(1);
    const el = raw ? document.getElementById(ALIASES[raw] ?? raw) : null;
    if (!el) return;
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    // Web fonts arriving reflow the page and move the target. Keep it pinned
    // while the page settles — until the visitor scrolls themselves.
    const pin = () => scrollToSection(el, false);
    const ro = new ResizeObserver(pin);
    const release = () => {
      ro.disconnect();
      window.clearTimeout(cap);
      for (const ev of ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const) window.removeEventListener(ev, release);
    };
    const cap = window.setTimeout(release, 2500);
    for (const ev of ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const) window.addEventListener(ev, release, { passive: true });
    ro.observe(document.body);
    requestAnimationFrame(pin);
    return release;
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = introDone ? '' : 'hidden';
  }, [introDone]);

  return (
    <>
      <BackgroundStage />
      <Ambient />
      {!introDone && <Intro onReady={prepare} onLeaving={arrive} onDone={finishIntro} />}

      <a
        href="#about"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[80] focus:rounded-full focus:bg-[var(--env-accent)] focus:px-5 focus:py-2 focus:font-mono focus:text-xs focus:text-black"
      >
        Skip to content
      </a>

      {/* `inert` while the intro is up, so focus can't wander underneath it. */}
      <div inert={!introDone} className={page === 'arriving' ? undefined : `is-${page}`}>
        <ChromeEnv>
          <TopBar />
          <NavRail />
        </ChromeEnv>
        <main>
          <Hero introPlayed={playIntro} arrived={page === 'arriving'} />
          <About />
          <Tech />
          <Omarchy />
          <Automation />
          <Projects />
          <Games />
          <Strategy />
          <Words />
          <Driving />
          <CloverSection />
          <Outro />
        </main>
        <ChromeEnv>
          <Clover ready={introDone} />
        </ChromeEnv>
      </div>

      <ChromeEnv>
        <Ceremony />
        <SecretTerminal />
      </ChromeEnv>
    </>
  );
}

export default function App() {
  return (
    <ExperienceProvider>
      <Experience />
    </ExperienceProvider>
  );
}
