import { DRIVING } from '../data/content';
import Panel from '../components/ui/Panel';
import Reveal, { RevealWords } from '../components/ui/Reveal';
import SectionShell from '../components/ui/SectionShell';
import RoadCanvas from '../effects/RoadCanvas';
import { useDevice } from '../state/hooks';

export default function Driving() {
  const { reducedMotion, compact } = useDevice();

  return (
    <SectionShell id="driving" labelledBy="driving-title">
      <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <h2 id="driving-title" className="h-section">
            <RevealWords text={DRIVING.line} />
          </h2>
          <Reveal delay={0.12} as="p" className="prose-lede mt-7">
            {DRIVING.body}
          </Reveal>
          <Reveal delay={0.22} className="mt-9">
            <ul className="flex flex-wrap gap-2.5">
              {DRIVING.cues.map((c) => (
                <li key={c} className="chip">
                  {c}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <div className="lg:col-span-7">
          <Reveal delay={0.15}>
            <Panel brackets className="relative aspect-[16/11] w-full overflow-hidden sm:aspect-[16/9]">
              <RoadCanvas reduced={reducedMotion} label={`A ${DRIVING.car} driving along an empty road at night`} />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{ background: 'radial-gradient(90% 70% at 50% 42%, transparent 30%, color-mix(in oklab, var(--env-void) 75%, transparent) 100%)' }}
              />
              <p className="label absolute inset-x-0 top-5 text-center text-[var(--env-tint)] opacity-75">
                {compact || reducedMotion ? 'No destination' : 'Your pointer sets the pace · no destination'}
              </p>
            </Panel>
          </Reveal>
        </div>
      </div>
    </SectionShell>
  );
}
