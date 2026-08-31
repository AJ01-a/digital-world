import { motion } from 'motion/react';
import { DRIVING } from '../data/content';
import Panel from '../components/ui/Panel';
import Reveal, { RevealWords } from '../components/ui/Reveal';
import SectionShell from '../components/ui/SectionShell';
import RoadCanvas from '../effects/RoadCanvas';
import { useExperience } from '../state/experience';

export default function Driving() {
  const { reducedMotion, compact } = useExperience();

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
                <li
                  key={c}
                  className="rounded-full border border-[color-mix(in_oklab,var(--env-accent)_26%,transparent)] px-4 py-2 font-mono text-[0.6rem] tracking-[0.2em] text-[var(--env-tint)] uppercase"
                >
                  {c}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <div className="lg:col-span-7">
          <Reveal delay={0.15}>
            <Panel className="relative aspect-[16/11] w-full overflow-hidden sm:aspect-[16/9]">
              <RoadCanvas reduced={reducedMotion} />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{ background: 'radial-gradient(90% 70% at 50% 42%, transparent 30%, color-mix(in oklab, var(--env-void) 75%, transparent) 100%)' }}
              />
              <motion.p
                className="absolute inset-x-0 bottom-5 text-center font-mono text-[0.58rem] tracking-[0.26em] text-[var(--env-tint)] uppercase"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 0.75 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6, duration: 1 }}
              >
                {compact ? 'Somewhere · 11:48pm' : 'Move your pointer to steer · 11:48pm'}
              </motion.p>
            </Panel>
          </Reveal>
        </div>
      </div>
    </SectionShell>
  );
}
