import { useCallback, useRef, useState, type CSSProperties } from 'react';
import { CLOVER } from '../data/content';
import { CloverBody, CloverHead } from '../clover/CloverArt';
import Button from '../components/ui/Button';
import Panel from '../components/ui/Panel';
import Reveal, { RevealWords } from '../components/ui/Reveal';
import SectionShell from '../components/ui/SectionShell';
import { useActions, useDevice } from '../state/hooks';
import { rand } from '../lib/utils';

interface Heart { id: number; x: number; y: number; hx: number }

export default function CloverSection() {
  const { reducedMotion, compact } = useDevice();
  const { openClover } = useActions();
  const [hearts, setHearts] = useState<Heart[]>([]);
  const nextId = useRef(0);

  const pet = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (reducedMotion) return;
      const r = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      const batch = Array.from({ length: 4 }, () => ({ id: nextId.current++, x: x + rand(-3, 3), y: y + rand(-2, 2), hx: rand(-30, 30) }));
      setHearts((h) => [...h.slice(-16), ...batch]);
      window.setTimeout(() => setHearts((h) => h.filter((p) => !batch.includes(p))), 1600);
    },
    [reducedMotion],
  );

  return (
    <SectionShell id="clover" labelledBy="clover-title">
      <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <h2 id="clover-title" className="h-section">
            <RevealWords text={CLOVER.line} />
          </h2>
          <Reveal delay={0.12} as="p" className="prose-lede mt-7">
            {CLOVER.body}
          </Reveal>

          <Reveal delay={0.2} className="mt-8">
            <Panel className="flex items-start gap-4 p-5" style={{ borderColor: 'color-mix(in oklab, #ff9b52 30%, transparent)' }}>
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl" style={{ background: 'radial-gradient(circle at 50% 35%, #3a2414, #120a06)' }}>
                <CloverHead size={56} mood="happy" />
              </div>
              <dl className="min-w-0 space-y-2.5 text-[0.92rem]">
                <div>
                  <dt className="label text-[#ffb27a]">Name</dt>
                  <dd className="mt-0.5 text-[var(--color-ink)]">Clover</dd>
                </div>
                <div>
                  <dt className="label text-[#ffb27a]">Breed</dt>
                  <dd className="mt-0.5 text-[var(--color-ink-dim)]">{CLOVER.breed}</dd>
                </div>
                <div>
                  <dt className="label text-[#ffb27a]">Colours</dt>
                  <dd className="mt-0.5 text-[var(--color-ink-dim)]">{CLOVER.colors}</dd>
                </div>
              </dl>
            </Panel>
            <p className="mt-3 text-[0.82rem] leading-relaxed text-[var(--color-ink-faint)]">{CLOVER.note}</p>
          </Reveal>

          <Reveal delay={0.26} className="mt-7 flex flex-wrap gap-3">
            <Button variant="solid" onClick={() => openClover()}>
              Talk to Clover
            </Button>
            <Button variant="quiet" onClick={() => openClover('Do a trick!')}>
              Ask for a trick →
            </Button>
          </Reveal>
        </div>

        <div className="lg:col-span-7">
          <Reveal delay={0.15}>
            <Panel brackets className="relative aspect-[16/11] w-full overflow-hidden sm:aspect-[16/9]">
              <div
                className="absolute inset-0 cursor-pointer"
                onPointerDown={pet}
                role="presentation"
                style={{
                  containerType: 'inline-size',
                  background:
                    'radial-gradient(90% 70% at 26% 74%, rgba(255,170,100,0.38) 0%, transparent 60%), linear-gradient(180deg, #170d1e 0%, #3a1d16 52%, #20100a 100%)',
                }}
              >
                {/* low sun */}
                <div className="absolute h-28 w-28 rounded-full" style={{ left: '18%', bottom: '24%', background: 'radial-gradient(circle, #ffe0b0 0%, rgba(255,180,110,0.45) 45%, transparent 70%)' }} />
                {/* a few early stars — it is the same world, after all */}
                <svg viewBox="0 0 600 200" className="absolute inset-x-0 top-0 h-[45%] w-full opacity-70" aria-hidden="true">
                  {[[60, 40], [140, 90], [230, 30], [330, 70], [420, 24], [500, 80], [560, 36]].map(([x, y]) => (
                    <circle key={x} cx={x} cy={y} r="1.3" fill="#fff4e6" />
                  ))}
                </svg>
                {/* far hills */}
                <svg viewBox="0 0 600 120" preserveAspectRatio="none" className="absolute inset-x-0 bottom-[24%] h-[26%] w-full" aria-hidden="true">
                  <path
                    d="M0 120 L0 78 C40 74 52 52 84 56 C110 60 122 40 150 46 C182 52 196 34 226 42 C258 50 272 30 302 40 C332 50 346 34 374 44 C404 54 420 40 448 48 C476 56 492 44 520 52 C548 60 566 74 600 76 L600 120 Z"
                    fill="#1c0f0c"
                    opacity="0.9"
                  />
                </svg>
                {/* ground */}
                <div className="absolute inset-x-0 bottom-0 h-[26%]" style={{ background: 'linear-gradient(180deg, #1a0d09, #0b0605)' }} />

                {/* Clover on his walk */}
                <div className={reducedMotion ? 'absolute bottom-[12%] left-[40%] w-[30%] min-w-[150px]' : 'anim-walk absolute bottom-[12%] w-[30%] min-w-[150px]'}>
                  <CloverBody animated={!reducedMotion} />
                </div>

                {/* foreground grass */}
                <svg viewBox="0 0 600 90" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[18%] w-full" aria-hidden="true">
                  <g stroke="#0b0605" strokeWidth="3" strokeLinecap="round" fill="none" className={reducedMotion ? undefined : 'anim-sway'}>
                    {Array.from({ length: 60 }).map((_, i) => {
                      const x = (i * 613) % 600;
                      const hgt = 26 + ((i * 37) % 44);
                      const lean = ((i * 17) % 20) - 10;
                      return <path key={i} d={`M${x} 90 q${lean / 2} ${-hgt / 2} ${lean} ${-hgt}`} />;
                    })}
                  </g>
                </svg>

                {hearts.map((h) => (
                  <span
                    key={h.id}
                    aria-hidden="true"
                    className="pointer-events-none absolute text-[18px] text-[#ff9b52]"
                    style={{ left: `${h.x}%`, top: `${h.y}%`, animation: 'heart 1.5s var(--ease-out-expo) both', ['--hx' as string]: `${h.hx}px` } as CSSProperties}
                  >
                    ♥
                  </span>
                ))}
              </div>

              <p className="label pointer-events-none absolute inset-x-0 bottom-4 text-center text-[#e8c9b0] opacity-80">
                {compact ? 'Tap to give Clover some love' : 'Click to give Clover some love'}
              </p>
            </Panel>
          </Reveal>
        </div>
      </div>
    </SectionShell>
  );
}
