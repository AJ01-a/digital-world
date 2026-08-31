import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useRef, useState } from 'react';
import { DOG } from '../data/content';
import Panel from '../components/ui/Panel';
import Reveal, { RevealWords } from '../components/ui/Reveal';
import SectionShell from '../components/ui/SectionShell';
import { useDevice } from '../state/experience';
import { rand } from '../lib/utils';

/** Side-on dog silhouette, drawn as paths so it stays crisp at any size. */
function DogSilhouette({ animated }: { animated: boolean }) {
  return (
    <svg viewBox="0 0 120 80" className="h-full w-full" aria-hidden="true" fill="currentColor">
      <g className={animated ? 'dog-bob' : undefined}>
        {/* legs behind */}
        <g opacity="0.75">
          <rect className={animated ? 'leg-b' : undefined} x="34" y="48" width="4.6" height="22" rx="2.3" style={{ transformOrigin: '36px 50px' }} />
          <rect className={animated ? 'leg-a' : undefined} x="66" y="48" width="4.6" height="22" rx="2.3" style={{ transformOrigin: '68px 50px' }} />
        </g>
        {/* tail */}
        <path
          className={animated ? 'dog-tail' : undefined}
          d="M28 38 C16 34 12 22 19 13"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          style={{ transformOrigin: '28px 38px' }}
        />
        {/* body */}
        <ellipse cx="52" cy="42" rx="27" ry="13.5" />
        {/* chest + neck */}
        <path d="M70 46 C76 44 80 38 82 32 L92 34 C90 44 84 50 74 52 Z" />
        {/* head */}
        <ellipse cx="90" cy="26" rx="11.5" ry="9" />
        <path d="M99 24 C106 24 110 27 110 29.5 C110 32 106 33.5 99 33 Z" />
        {/* ear */}
        <path d="M85 18 C82 9 84 6 88 8 C91 9.5 93 14 93 19 Z" />
        {/* legs front */}
        <g>
          <rect className={animated ? 'leg-a' : undefined} x="40" y="48" width="5" height="23" rx="2.5" style={{ transformOrigin: '42px 50px' }} />
          <rect className={animated ? 'leg-b' : undefined} x="72" y="48" width="5" height="23" rx="2.5" style={{ transformOrigin: '74px 50px' }} />
        </g>
      </g>
    </svg>
  );
}

interface Seed { id: number; x: number; y: number; drift: number; rise: number }

export default function Dog() {
  const { reducedMotion, compact } = useDevice();
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const nextId = useRef(0);

  const scatter = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (reducedMotion) return;
      const r = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      const batch = Array.from({ length: 7 }, () => ({
        id: nextId.current++,
        x: x + rand(-4, 4),
        y: y + rand(-3, 3),
        drift: rand(-26, 26),
        rise: rand(-150, -90),
      }));
      setSeeds((s) => [...s.slice(-28), ...batch]);
      window.setTimeout(() => {
        setSeeds((s) => s.filter((seed) => !batch.some((b) => b.id === seed.id)));
      }, 4200);
    },
    [reducedMotion],
  );

  return (
    <SectionShell id="dog" labelledBy="dog-title">
      <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <h2 id="dog-title" className="h-section">
            <RevealWords text={DOG.line} />
          </h2>
          <Reveal delay={0.12} as="p" className="prose-lede mt-7">
            {DOG.body}
          </Reveal>
          <Reveal delay={0.22} className="mt-9">
            <ul className="flex flex-wrap gap-2.5">
              {DOG.cues.map((c) => (
                <li
                  key={c}
                  className="rounded-full border border-[color-mix(in_oklab,var(--env-accent)_28%,transparent)] px-4 py-2 font-mono text-[0.68rem] tracking-[0.2em] text-[var(--env-tint)] uppercase"
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
              <div
                className="absolute inset-0 cursor-crosshair"
                onPointerDown={scatter}
                role="presentation"
                style={{
                  // A query container, so the walk is measured against the
                  // panel rather than the dog's own width.
                  containerType: 'inline-size',
                  background:
                    'radial-gradient(120% 90% at 24% 78%, color-mix(in oklab, #ffcf94 45%, transparent) 0%, transparent 55%), linear-gradient(180deg, color-mix(in oklab, var(--env-b) 70%, transparent) 0%, color-mix(in oklab, var(--env-void) 90%, transparent) 100%)',
                }}
              >
                {/* sun */}
                <div
                  className="absolute h-24 w-24 rounded-full blur-[2px]"
                  style={{ left: '20%', bottom: '26%', background: 'radial-gradient(circle, #ffd9a4 0%, rgba(255,190,120,0.35) 55%, transparent 72%)' }}
                />
                {/* distant treeline */}
                <svg viewBox="0 0 600 120" preserveAspectRatio="none" className="absolute inset-x-0 bottom-[26%] h-[26%] w-full opacity-45" aria-hidden="true">
                  <path
                    d="M0 120 L0 78 C40 74 52 52 84 56 C110 60 122 40 150 46 C182 52 196 34 226 42 C258 50 272 30 302 40 C332 50 346 34 374 44 C404 54 420 40 448 48 C476 56 492 44 520 52 C548 60 566 74 600 76 L600 120 Z"
                    fill="color-mix(in oklab, var(--env-void) 88%, transparent)"
                  />
                </svg>
                {/* ground */}
                <div
                  className="absolute inset-x-0 bottom-0 h-[27%]"
                  style={{ background: 'linear-gradient(180deg, color-mix(in oklab, var(--env-void) 78%, transparent), color-mix(in oklab, var(--env-void) 96%, black))' }}
                />

                {/* the walk */}
                <div
                  className={reducedMotion ? 'absolute bottom-[22%] left-[46%] w-[16%] min-w-[86px]' : 'dog-walk absolute bottom-[22%] w-[16%] min-w-[86px]'}
                  style={{ color: 'color-mix(in oklab, var(--env-void) 92%, black)' }}
                >
                  <DogSilhouette animated={!reducedMotion} />
                </div>

                {/* foreground grass */}
                <svg viewBox="0 0 600 90" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[22%] w-full" aria-hidden="true">
                  <g stroke="color-mix(in oklab, var(--env-void) 96%, black)" strokeWidth="3" strokeLinecap="round" fill="none" className={reducedMotion ? undefined : 'grass-sway'}>
                    {Array.from({ length: 60 }).map((_, i) => {
                      const x = (i * 613) % 600;
                      const hgt = 26 + ((i * 37) % 44);
                      const lean = ((i * 17) % 20) - 10;
                      return <path key={i} d={`M${x} 90 q${lean / 2} ${-hgt / 2} ${lean} ${-hgt}`} />;
                    })}
                  </g>
                </svg>

                {/* drifting seeds */}
                <AnimatePresence>
                  {seeds.map((s) => (
                    <motion.span
                      key={s.id}
                      className="pointer-events-none absolute h-1.5 w-1.5 rounded-full"
                      style={{ left: `${s.x}%`, top: `${s.y}%`, background: 'rgba(255,225,180,0.9)', boxShadow: '0 0 10px rgba(255,205,140,0.7)' }}
                      initial={{ opacity: 0, scale: 0.4 }}
                      animate={{ opacity: [0, 0.9, 0], y: s.rise, x: s.drift, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 4, ease: 'easeOut' }}
                    />
                  ))}
                </AnimatePresence>
              </div>

              <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center font-mono text-[0.66rem] tracking-[0.26em] text-[color-mix(in_oklab,var(--color-ink)_70%,var(--env-tint))] uppercase">
                {compact ? 'Tap the field' : 'Click the field · golden hour'}
              </p>
            </Panel>
          </Reveal>
        </div>
      </div>
    </SectionShell>
  );
}
