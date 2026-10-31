import { useState, type CSSProperties } from 'react';
import { BOOK } from '../data/content';
import { BOOK_ART } from '../data/bookArt';
import { useTilt } from '../hooks/useTilt';
import { useReveal } from '../hooks/useInView';
import Reveal, { RevealWords } from '../components/ui/Reveal';
import SectionShell from '../components/ui/SectionShell';
import { cn } from '../lib/utils';

const base = import.meta.env.BASE_URL;
const COVER = 'atomic-habits';
const COVER_ALT = 'The cover of Atomic Habits by James Clear: a white cover with the title in dotted gold letters.';

/**
 * The cover, from the generated manifest (scripts/book-art.py). If it is
 * missing or fails to load, a typeset stand-in takes its place at the same
 * size — never a broken image.
 */
function Cover() {
  const art = BOOK_ART[COVER];
  const [failed, setFailed] = useState(false);

  if (!art || failed) {
    return (
      <div role="img" aria-label={COVER_ALT} className="book-placeholder absolute inset-0 flex flex-col items-center justify-center gap-1 px-4 text-center">
        <span className="book-placeholder-title">Atomic</span>
        <span className="book-placeholder-title">Habits</span>
        <span className="mt-6 font-sans text-[0.95rem] font-semibold tracking-[0.02em] text-[#2a2522]">James Clear</span>
      </div>
    );
  }
  const set = (type: 'avif' | 'webp') => art.widths.map((w) => `${base}books/${COVER}-${w}.${type} ${w}w`).join(', ');
  const sizes = '(min-width: 1024px) 320px, 60vw';
  return (
    <picture>
      <source type="image/avif" srcSet={set('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={set('webp')} sizes={sizes} />
      <img
        src={`${base}books/${COVER}-${art.widths[0]}.webp`}
        alt={COVER_ALT}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </picture>
  );
}

/** The book itself: lit from the left like the rest of the site, a crimson ribbon marking my place. */
function BookObject() {
  const ref = useReveal<HTMLElement>();
  const tilt = useTilt<HTMLDivElement>(6);
  return (
    <figure ref={ref} className="book-stage">
      <span aria-hidden="true" className="book-light" />
      <div className="book-enter">
        <div className="book" onPointerMove={tilt.onPointerMove} onPointerLeave={tilt.onPointerLeave}>
          <span aria-hidden="true" className="book-pages" />
          <span aria-hidden="true" className="book-ribbon" />
          <div className="book-cover">
            <Cover />
            <span aria-hidden="true" className="book-hinge" />
            <span aria-hidden="true" className="book-sheen" />
          </div>
        </div>
      </div>
      <span aria-hidden="true" className="book-floor" />
      <figcaption className="label mt-9 text-center text-[var(--env-tint)]">
        {BOOK.title} · {BOOK.author}
      </figcaption>
    </figure>
  );
}

/* ── Small steps ───────────────────────────────────────────── */

const STEPS = 28;
/** Two off days, on purpose: progress holds rather than starting over. */
const OFF_DAYS = new Set([8, 17]);
const ROWS = 12;
const CELL = 10;

/** How tall each column stands — a slow start, then it builds. Illustrative only. */
function heights() {
  const out: number[] = [];
  let h = 1;
  for (let i = 0; i < STEPS; i++) {
    if (!OFF_DAYS.has(i)) h = Math.max(h, 1 + Math.round(Math.pow(i / (STEPS - 1), 1.7) * (ROWS - 1)));
    out.push(h);
  }
  return out;
}
const COLS = heights();

function SmallSteps() {
  const [taken, setTaken] = useState(4);

  const s = BOOK.steps;
  const caption =
    taken === 0 ? s.none : taken === STEPS ? s.full : taken <= 6 ? s.early : taken <= 15 ? s.middle : s.late;
  const passedOff = [...OFF_DAYS].some((d) => d < taken);
  const W = STEPS * CELL;
  const H = ROWS * CELL + 8;

  return (
    <div className="surface brackets grid gap-8 overflow-hidden p-6 sm:p-9 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-5">
        <p className="eyebrow">The idea</p>
        <p className="serif mt-4 text-[clamp(1.3rem,1.1rem+0.8vw,1.75rem)] leading-[1.3] text-[var(--color-ink)]">{BOOK.idea.text}</p>
        <p className="mt-4 text-[0.82rem] text-[var(--color-ink-faint)]">{BOOK.idea.note}</p>
      </div>

      <div className="lg:col-span-7">
        <svg viewBox={`0 0 ${W} ${H}`} className="steps block h-auto w-full" role="img" aria-label={`An illustration of small steps building up: ${taken} of ${STEPS} taken.`}>
          {COLS.map((h, i) => {
            const on = i < taken;
            const off = OFF_DAYS.has(i);
            const latest = i === taken - 1;
            const x = i * CELL + CELL / 2;
            return (
              <g key={i} className={cn('steps-col', on && 'is-on', off && 'is-off', latest && 'is-latest')}>
                {/* Every column keeps a mark on the line, taken or not. */}
                <circle className="steps-base" cx={x} cy={H - 2} r={0.9} />
                {Array.from({ length: h }, (_, j) => (
                  <circle key={j} className="steps-dot" cx={x} cy={H - 8 - j * CELL} r={off ? 2.3 : 2.6} style={{ '--j': j } as CSSProperties} />
                ))}
              </g>
            );
          })}
        </svg>

        <div className="mt-6 flex items-center justify-between gap-4">
          <label htmlFor="steps-range" className="label text-[var(--env-tint)]">
            Small steps
          </label>
          <span className="label tabular-nums text-[var(--color-ink-dim)]" aria-hidden="true">
            {String(taken).padStart(2, '0')} / {STEPS}
          </span>
        </div>
        <input
          id="steps-range"
          type="range"
          min={0}
          max={STEPS}
          step={1}
          value={taken}
          onChange={(e) => setTaken(Number(e.target.value))}
          aria-valuetext={`${taken} of ${STEPS} small steps`}
          className="steps-range mt-1 block w-full"
        />
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <button type="button" className="btn btn-ghost w-full sm:w-auto" onClick={() => setTaken((t) => Math.min(STEPS, t + 1))} disabled={taken === STEPS}>
            Take one small step
          </button>
          {taken > 0 && (
            <button type="button" className="btn btn-quiet mx-auto sm:mx-0" onClick={() => setTaken(0)}>
              Reset steps
            </button>
          )}
        </div>

        <div className="mt-5 min-h-[4.5rem]" aria-live="polite">
          <p key={caption} className="text-[1rem] leading-relaxed text-[var(--color-ink)]" style={{ animation: 'rise-in 500ms var(--ease-out-expo) both' }}>
            {caption}
          </p>
          {passedOff && <p className="mt-1 text-[0.9rem] leading-relaxed text-[var(--color-ink-dim)]">{s.offDays}</p>}
        </div>
        <p className="mt-2 text-[0.78rem] text-[var(--color-ink-faint)]">{s.disclaimer}</p>
      </div>
    </div>
  );
}

/* ── What it changed ───────────────────────────────────────── */

/** A page from my own notebook: the changes, written in the margin. */
function Changes() {
  return (
    <div className="book-page h-full p-6 pl-12 sm:p-10 sm:pl-16">
      <span aria-hidden="true" className="book-page-margin" />
      <p className="book-page-eyebrow">What it changed for me</p>
      <ol className="mt-6 grid gap-6 sm:grid-cols-2 sm:gap-x-8">
        {BOOK.changes.map((c, i) => (
          <Reveal as="li" key={c.k} delay={i * 0.08} className="relative">
            <span aria-hidden="true" className="book-page-num">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h4 className="font-display text-[0.98rem] tracking-[-0.01em] text-[#1d1815]">{c.k}</h4>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-[#4a413a]">{c.v}</p>
          </Reveal>
        ))}
      </ol>
      <p className="mt-8 text-[0.82rem] text-[#6a6058]">{BOOK.changesNote}</p>
    </div>
  );
}

/* ── Still a work in progress ──────────────────────────────── */

function WorkInProgress() {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn('wip surface flex h-full flex-col p-6 sm:p-9', open && 'is-open')}>
      <p className="eyebrow">Still a work in progress</p>
      <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--color-ink-dim)]">{BOOK.wip.lead}</p>

      {/* No finish line: the track fades out ahead of where I am. */}
      <div aria-hidden="true" className="wip-track relative mt-10 mb-3 h-6">
        <span className="wip-tail absolute top-1/2 right-0 left-0 h-px" />
        <span className="wip-fill absolute top-1/2 left-0 h-px w-full" />
        <span className="wip-me absolute top-0 bottom-0 left-0 w-0">
          <span className="wip-dot absolute top-1/2 left-0" />
          <span className="label absolute bottom-full left-0 mb-1 -translate-x-1/2 whitespace-nowrap text-[var(--color-ink)]">Me, now</span>
        </span>
      </div>
      <p aria-hidden="true" className="label text-right text-[var(--color-ink-faint)]">No finish line</p>

      <div className="mt-8 lg:mt-auto lg:pt-8">
        <button type="button" className="btn btn-ghost" aria-expanded={open} aria-controls="wip-note" onClick={() => setOpen((o) => !o)}>
          {BOOK.wip.ask}
        </button>
      </div>
      <div id="wip-note" hidden={!open} className="wip-note mt-6 min-h-0">
        <p className="serif text-[clamp(1.35rem,1.15rem+0.8vw,1.8rem)] leading-[1.2] text-[var(--color-ink)]">{BOOK.wip.answer}</p>
        <p className="mt-3 leading-relaxed text-[var(--color-ink-dim)]">{BOOK.wip.body}</p>
      </div>
    </div>
  );
}

export default function Book() {
  return (
    <SectionShell id="book" labelledBy="book-title" size="auto" className="book-sec">
      <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-5">
          <BookObject />
        </div>
        <div className="lg:col-span-7">
          <h2 id="book-title" className="h-section">
            <span className="block text-[0.62em] text-[var(--env-tint)]">
              <RevealWords text={`${BOOK.kicker} —`} />
            </span>
            <span className="serif mt-1 block text-[1.55em] leading-[1.02] text-[var(--color-ink)]">
              <RevealWords text={BOOK.title} delay={0.15} />
            </span>
          </h2>
          <Reveal delay={0.2} as="p" className="label mt-4 text-[var(--env-accent)]">
            by {BOOK.author}
          </Reveal>
          <Reveal delay={0.25} as="p" className="mt-7 max-w-[40ch] text-[clamp(1.15rem,1.02rem+0.55vw,1.45rem)] leading-[1.5] font-light text-[var(--color-ink)]">
            {BOOK.lede}
          </Reveal>
          <div className="mt-6 space-y-5">
            {BOOK.body.map((p, i) => (
              <Reveal key={i} delay={0.3 + i * 0.08} as="p" className="prose-lede">
                {p}
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      <Reveal className="mt-16 md:mt-24">
        <SmallSteps />
      </Reveal>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <Reveal className="lg:col-span-7">
          <Changes />
        </Reveal>
        <Reveal delay={0.1} className="lg:col-span-5">
          <WorkInProgress />
        </Reveal>
      </div>

      <Reveal as="div" className="mx-auto mt-20 max-w-[44rem] text-center md:mt-28">
        <span aria-hidden="true" className="draw-x mx-auto block h-px w-24 [background:linear-gradient(90deg,transparent,#d8b27c,transparent)]" />
        <p className="eyebrow mt-6">What I take from it</p>
        <p className="serif mt-5 text-[clamp(1.5rem,1.15rem+1.6vw,2.5rem)] leading-[1.2] text-[var(--color-ink)]">{BOOK.close}</p>
      </Reveal>

      <Reveal as="p" className="mt-14 text-[0.78rem] text-[var(--color-ink-faint)]">
        {BOOK.credit}
      </Reveal>
    </SectionShell>
  );
}
