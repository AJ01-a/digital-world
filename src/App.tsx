import { useEffect, useState } from 'react';
import { useAmbient } from './audio/ambient';
import Ceremony from './components/chrome/Ceremony';
import Cursor from './components/chrome/Cursor';
import Loader from './components/chrome/Loader';
import NavRail from './components/chrome/NavRail';
import SecretTerminal from './components/chrome/SecretTerminal';
import TopBar from './components/chrome/TopBar';
import BackgroundStage from './effects/BackgroundStage';
import About from './sections/About';
import Automation from './sections/Automation';
import Dog from './sections/Dog';
import Driving from './sections/Driving';
import Games from './sections/Games';
import Hero from './sections/Hero';
import Omarchy from './sections/Omarchy';
import Outro from './sections/Outro';
import Strategy from './sections/Strategy';
import Tech from './sections/Tech';
import Words from './sections/Words';
import { ExperienceProvider, useExperience } from './state/experience';

function Ambient() {
  const { audioOn, active } = useExperience();
  useAmbient(audioOn, active);
  return null;
}

function Experience() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    document.documentElement.style.overflow = ready ? '' : 'hidden';
  }, [ready]);

  return (
    <>
      <BackgroundStage />
      <Ambient />
      <Loader onDone={() => setReady(true)} />

      {ready && (
        <>
          <a
            href="#about"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[80] focus:rounded-full focus:bg-[var(--env-accent)] focus:px-5 focus:py-2 focus:font-mono focus:text-xs focus:text-black"
          >
            Skip to content
          </a>
          <TopBar />
          <NavRail />
          <Cursor />
          <Ceremony />
          <SecretTerminal />

          <main>
            <Hero />
            <About />
            <Games />
            <Strategy />
            <Words />
            <Tech />
            <Omarchy />
            <Automation />
            <Driving />
            <Dog />
            <Outro />
          </main>
        </>
      )}
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
