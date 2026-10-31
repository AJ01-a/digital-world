import { useState } from 'react';
import { useReveal } from '../hooks/useInView';
import { LOKI } from '../data/content';
import Reveal, { RevealWords } from '../components/ui/Reveal';
import SectionShell from '../components/ui/SectionShell';
import ShowArt from '../components/ui/ShowArt';
import { cn } from '../lib/utils';

const GOLD = '#e0bd68';
/* The journey's colour, station by station: the site's crimson for the
   villain, through silver, into emerald, ending in gold. */
const STAGE_COLOURS = ['#ff4a57', '#b9aab4', '#5fd49c', '#8ad79a', GOLD];

/* Painted stand-ins if the artwork is ever missing. */
const TVA_FALLBACK = 'radial-gradient(55% 70% at 45% 40%, #3b2f22, #120f0c 60%, #030605)';
const THRONE_FALLBACK = 'radial-gradient(50% 65% at 50% 40%, #2f6b45, #0e2318 55%, #030605)';

/** Where it starts: the TVA, the spiral of time, and the line he arrived with. */
function Before() {
  return (
    <figure className="show-frame relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#030605] sm:aspect-[16/9]">
      <div className="show-art show-parallax">
        <ShowArt
          id="loki-tva"
          alt="Loki at the TVA, surrounded by a spiral walkway of figures winding through a giant clock face."
          sizes="(min-width: 1180px) 1180px, 100vw"
          focus="46% 34%"
          fallback={TVA_FALLBACK}
        />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(180deg, transparent 40%, #030605f2 100%), linear-gradient(90deg, #030605b3, transparent 55%)' }}
      />
      <figcaption className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
        <p className="eyebrow mb-3">Where it starts</p>
        <blockquote className="loki-glitch serif max-w-[24ch] text-[clamp(1.35rem,1.05rem+1.4vw,2.3rem)] leading-[1.18] text-[var(--color-ink)]">
          “{LOKI.before.text}”
        </blockquote>
        <p className="label mt-3 text-[var(--env-tint)]">{LOKI.before.source}</p>
      </figcaption>
    </figure>
  );
}

/** Villain to the god he needed to be. The track fills as you scroll. */
function Journey() {
  return (
    <div className="mx-auto max-w-[920px]">
      <Reveal className="mb-10 text-center">
        <p className="eyebrow">The journey</p>
        <h3 className="display mt-3 text-[clamp(1.4rem,1.1rem+1.4vw,2.2rem)] leading-[1.15] text-[var(--color-ink)]">From villain to the god he needed to be</h3>
      </Reveal>
      <div className="relative">
        <span aria-hidden="true" className="absolute top-2 bottom-2 left-[7px] w-px bg-white/10 md:left-[calc(25%+7px)]" />
        <span
          aria-hidden="true"
          className="loki-track-fill absolute top-2 bottom-2 left-[7px] w-px origin-top md:left-[calc(25%+7px)]"
          style={{ background: `linear-gradient(180deg, ${STAGE_COLOURS.join(', ')})` }}
        />
        <ol className="relative">
        {LOKI.journey.map((s, i) => (
          <Reveal as="li" key={s.k} delay={0.05} className="relative grid gap-1 pb-10 pl-9 last:pb-0 md:grid-cols-4 md:gap-8 md:pl-0">
            <p className="label pt-1 text-[var(--env-tint)] md:pr-6 md:text-right">{s.when}</p>
            <span
              aria-hidden="true"
              className="absolute top-1.5 left-0 h-[15px] w-[15px] rotate-45 border bg-[#030605] md:left-[25%]"
              style={{ borderColor: STAGE_COLOURS[i], boxShadow: i === STAGE_COLOURS.length - 1 ? `0 0 18px ${GOLD}66` : undefined }}
            />
            <div className="md:col-span-3 md:pl-10">
              <h4 className={cn('font-display text-[1.08rem] tracking-[-0.01em]', i === 0 && 'loki-glitch')} style={{ color: i === LOKI.journey.length - 1 ? GOLD : 'var(--color-ink)' }}>
                {s.k}
              </h4>
              <p className="mt-2 max-w-[58ch] leading-relaxed text-[var(--color-ink-dim)]">{s.v}</p>
            </div>
          </Reveal>
        ))}
        </ol>
      </div>
    </div>
  );
}

/** The same two words, then and now. */
function Purpose() {
  const [now, setNow] = useState(false);
  const side = now ? LOKI.purpose.now : LOKI.purpose.then;

  return (
    <div className={cn('purpose surface grid overflow-hidden p-0 md:grid-cols-2', now && 'is-now')}>
      <div className="relative aspect-[4/3] overflow-hidden md:aspect-auto md:min-h-[26rem]">
        <ShowArt
          id="loki-throne"
          alt="Loki as the God of Stories, crowned and robed in green, raising one hand amid strands of green light."
          sizes="(min-width: 768px) 590px, 100vw"
          focus="52% 30%"
          fallback={THRONE_FALLBACK}
          className="purpose-art"
        />
        {/* "Then" keeps him in shadow; "now" lets the light in. */}
        <div aria-hidden="true" className="purpose-shade pointer-events-none absolute inset-0" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 md:hidden" style={{ background: 'linear-gradient(180deg, transparent 60%, #030605 100%)' }} />
      </div>
      <div className="flex flex-col justify-center p-6 sm:p-9">
        <p className="eyebrow">What “glorious purpose” means</p>
        <div role="group" aria-label="Then or now" className="mt-5 inline-flex w-fit rounded-full border border-white/12 p-1">
          {[LOKI.purpose.then, LOKI.purpose.now].map((p, i) => {
            const pressed = now === (i === 1);
            return (
              <button
                key={p.label}
                type="button"
                aria-pressed={pressed}
                onClick={() => setNow(i === 1)}
                className={cn(
                  'min-h-10 rounded-full px-5 font-mono text-[0.66rem] tracking-[0.2em] uppercase transition-colors duration-300',
                  pressed ? 'text-[#06100b]' : 'text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]',
                )}
                style={pressed ? { background: i === 1 ? GOLD : '#b9aab4' } : undefined}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <div className="mt-7 min-h-[10rem]" aria-live="polite">
          <div key={side.label} style={{ animation: 'rise-in 600ms var(--ease-out-expo) both' }}>
            <p className="font-display text-[clamp(1.3rem,1.1rem+0.9vw,1.85rem)] leading-[1.2] tracking-[-0.02em]" style={{ color: now ? GOLD : 'var(--color-ink)' }}>
              {side.head}
            </p>
            <p className="mt-3 leading-relaxed text-[var(--color-ink-dim)]">{side.body}</p>
          </div>
        </div>
        {!now && (
          <p className="mt-2 text-[0.82rem] text-[var(--color-ink-faint)]">Switch to “Now” to see what it became.</p>
        )}
      </div>
    </div>
  );
}

export default function Loki() {
  const quoteRef = useReveal<HTMLElement>('0px 0px -20% 0px');
  return (
    <SectionShell id="loki" labelledBy="loki-title" size="auto" className="loki-sec">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="eyebrow mb-4">Marvel · Loki</p>
          <h2 id="loki-title" className="h-section">
            <RevealWords text={LOKI.title} />
          </h2>
        </div>
        <div className="lg:col-span-5">
          <Reveal delay={0.15} as="p" className="prose-lede">
            {LOKI.lede}
          </Reveal>
        </div>
      </div>

      <Reveal delay={0.1} className="mt-10 md:mt-12">
        <Before />
      </Reveal>

      <div className="mt-16 md:mt-24">
        <Journey />
      </div>

      <Reveal className="mt-16 md:mt-24">
        <Purpose />
      </Reveal>

      {/* The line itself — his words, in three beats with a breath between them. */}
      <figure ref={quoteRef} className="loki-quote relative isolate mx-auto mt-20 max-w-[62rem] px-2 py-14 text-center md:mt-28 md:py-20">
        <span aria-hidden="true" className="loki-quote-light pointer-events-none absolute inset-0 -z-10" />
        <span aria-hidden="true" className="draw-x mx-auto block h-px w-24" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />
        <p className="eyebrow mt-6">His words</p>
        <blockquote className="serif mt-6 text-[clamp(1.75rem,1.15rem+2.7vw,3.4rem)] leading-[1.16] text-[var(--color-ink)]">
          <p>
            <span className="beat block">“{LOKI.quote.beats[0]}</span>{' '}
            <span className="beat beat-2 inline-block">{LOKI.quote.beats[1]}</span>{' '}
            <span className="beat beat-3 loki-final inline-block">{LOKI.quote.beats[2]}”</span>
          </p>
        </blockquote>
        <figcaption className="beat beat-4 label mt-8" style={{ color: GOLD }}>
          {LOKI.quote.source}
        </figcaption>
      </figure>

      <div className="mt-20 md:mt-28">
        <Reveal className="mb-6 flex items-center gap-4">
          <p className="eyebrow">My reflections</p>
          <span className="hairline h-px flex-1" />
          <p className="eyebrow hidden opacity-70 sm:block">My words, not the show's</p>
        </Reveal>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LOKI.reflections.map((r, i) => (
            <Reveal
              as="li"
              key={r.k}
              delay={i * 0.08}
              className="reflection surface flex flex-col p-6"
            >
              <span className="font-mono text-[0.62rem] tracking-[0.2em]" style={{ color: i === LOKI.reflections.length - 1 ? GOLD : 'var(--env-accent)' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <h4 className="font-display mt-3 text-[1rem] tracking-[-0.01em] text-[var(--color-ink)]">{r.k}</h4>
              <p className="mt-2 text-[0.94rem] leading-relaxed text-[var(--color-ink-dim)]">{r.v}</p>
            </Reveal>
          ))}
        </ul>
      </div>

      <Reveal as="p" className="serif mx-auto mt-16 max-w-[40ch] text-center text-[clamp(1.3rem,1.1rem+0.9vw,1.85rem)] leading-snug md:mt-20">
        <span style={{ color: GOLD }}>{LOKI.close}</span>
      </Reveal>

      <Reveal as="p" className="mt-12 text-[0.78rem] text-[var(--color-ink-faint)]">
        Loki artwork © Marvel Studios / Disney — shown here as a fan. Quotations are Loki's own lines; everything else is my commentary.
      </Reveal>
    </SectionShell>
  );
}
