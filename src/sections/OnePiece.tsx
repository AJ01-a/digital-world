import { useState } from 'react';
import { ONE_PIECE } from '../data/content';
import Panel from '../components/ui/Panel';
import Reveal, { RevealWords } from '../components/ui/Reveal';
import SectionShell from '../components/ui/SectionShell';
import ShowArt from '../components/ui/ShowArt';
import { useDevice } from '../state/hooks';
import { cn } from '../lib/utils';

/* Painted stand-ins if the artwork is ever missing. */
const SUNBURST = 'radial-gradient(60% 70% at 50% 35%, #ffd98a, #e08a2c 35%, #4a1608 75%, #140808)';
const HAT_RED = '#a10f0f';

/** Luffy in Gear 5 — tap (or click, or Enter) to wake the scene and read why it matters. */
function GearFive() {
  const [awake, setAwake] = useState(false);
  const { compact } = useDevice();

  return (
    <figure className={cn('g5 show-frame relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-[color-mix(in_oklab,var(--env-accent)_26%,transparent)] bg-[#140808] sm:aspect-[16/9]', awake && 'is-awake')}>
      <div className="show-art show-parallax">
        <div className="g5-zoom absolute inset-0">
          <ShowArt
            id="luffy-gear-5"
            alt="Luffy in Gear 5, laughing mid-leap with his arms thrown up against a burst of golden light."
            sizes="(min-width: 1180px) 1180px, 100vw"
            focus="50% 34%"
            fallback={SUNBURST}
          />
        </div>
      </div>
      <div aria-hidden="true" className="g5-flash pointer-events-none absolute inset-0" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(180deg, #14080899 0%, transparent 26%, transparent 48%, #140808f0 100%)' }}
      />

      <p className="label pointer-events-none absolute top-3 left-3 rounded-full bg-[#140808cc] px-3 py-1.5 text-white sm:top-4 sm:left-4">
        <span className="text-[#ff8a7f]">Monkey D. Luffy</span>
        <span className="opacity-80"> · Gear 5</span>
      </p>

      <figcaption className="absolute inset-x-0 bottom-0 p-4 sm:p-7">
        <div id="g5-note" hidden={!awake} className="g5-note mb-4 max-w-[46ch] rounded-xl border border-white/10 bg-[#140808e0] p-4 sm:mb-5 sm:p-5">
          <p className="eyebrow mb-2 text-[#ffd48a]">Why it matters to me</p>
          <p className="text-[0.98rem] leading-relaxed text-white sm:text-[1.08rem]">{ONE_PIECE.gear5.reveal}</p>
        </div>
        <button
          type="button"
          aria-expanded={awake}
          aria-controls="g5-note"
          onClick={() => setAwake((a) => !a)}
          className="btn btn-solid"
        >
          <span aria-hidden="true" className={cn('g5-sun', awake && 'is-on')} />
          {awake ? 'Back to calm' : compact ? 'Tap to awaken' : 'Awaken Gear 5'}
        </button>
      </figcaption>
    </figure>
  );
}

/** The straw hat lifts when you pick it up, and says what it stands for. */
function StrawHat() {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('hat surface relative flex h-full flex-col overflow-hidden p-0', open && 'is-open')}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="hat-meaning"
        onClick={() => setOpen((o) => !o)}
        className="group relative block aspect-[4/3] w-full overflow-hidden rounded-t-[18px] text-left focus-visible:outline-offset-[-4px]"
        style={{ background: HAT_RED }}
      >
        <span className="hat-zoom absolute inset-0">
          <ShowArt id="straw-hat" alt="" sizes="(min-width: 1024px) 480px, 100vw" focus="50% 34%" fallback={HAT_RED} />
        </span>
        <span aria-hidden="true" className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 55%, #2a0606cc 100%)' }} />
        <span className="absolute inset-x-4 bottom-3.5 flex items-center justify-between gap-3">
          <span className="font-display text-[1.05rem] tracking-[-0.01em] text-white">The straw hat</span>
          <span className="rounded-full border border-white/40 bg-black/35 px-3 py-1.5 font-mono text-[0.6rem] tracking-[0.18em] text-white uppercase transition-colors group-hover:bg-black/55">
            {open ? 'Put it down' : 'Pick it up'}
          </span>
        </span>
      </button>
      <div className="flex-1 px-5 py-5 sm:px-6">
        <p className="text-[0.92rem] leading-relaxed text-[var(--color-ink-dim)]">{ONE_PIECE.hat.story}</p>
        <p id="hat-meaning" hidden={!open} className="hat-meaning serif mt-3 text-[1.3rem] leading-snug text-[var(--color-ink)]">
          {ONE_PIECE.hat.reflection}
        </p>
      </div>
    </div>
  );
}

/** Six themes, one reflection at a time. */
function Lessons() {
  const [current, setCurrent] = useState(ONE_PIECE.lessons[0].id);
  const lesson = ONE_PIECE.lessons.find((l) => l.id === current) ?? ONE_PIECE.lessons[0];
  const index = ONE_PIECE.lessons.indexOf(lesson);

  return (
    <Panel brackets className="flex h-full flex-col p-6 sm:p-8">
      <p className="eyebrow">What it keeps teaching</p>
      <p className="mt-2 text-[0.82rem] text-[var(--color-ink-faint)]">My take — original reflections, not quotes from the show.</p>
      <div role="group" aria-label="Themes" className="mt-5 flex flex-wrap gap-2">
        {ONE_PIECE.lessons.map((l) => (
          <button
            key={l.id}
            type="button"
            aria-pressed={l.id === current}
            onClick={() => setCurrent(l.id)}
            className={cn(
              'min-h-10 rounded-full border px-4 font-mono text-[0.64rem] tracking-[0.18em] uppercase transition-colors duration-300',
              l.id === current
                ? 'border-[var(--env-accent)] bg-[color-mix(in_oklab,var(--env-accent)_16%,transparent)] text-[var(--color-ink)]'
                : 'border-white/12 text-[var(--color-ink-dim)] hover:border-[color-mix(in_oklab,var(--env-accent)_55%,transparent)] hover:text-[var(--color-ink)]',
            )}
          >
            {l.k}
          </button>
        ))}
      </div>
      <div className="mt-7 flex min-h-[8.5rem] flex-1 flex-col justify-center sm:min-h-[7rem]" aria-live="polite">
        <div key={lesson.id} style={{ animation: 'rise-in 500ms var(--ease-out-expo) both' }}>
          <p className="label text-[var(--env-accent)]">
            {String(index + 1).padStart(2, '0')} / {String(ONE_PIECE.lessons.length).padStart(2, '0')} · {lesson.k}
          </p>
          <p className="serif mt-3 text-[clamp(1.35rem,1.15rem+0.8vw,1.85rem)] leading-snug text-[var(--color-ink)]">{lesson.v}</p>
        </div>
      </div>
    </Panel>
  );
}

export default function OnePiece() {
  return (
    <SectionShell id="onepiece" labelledBy="onepiece-title" size="auto" className="op-sec">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="eyebrow mb-4">Favourite anime · One Piece</p>
          <h2 id="onepiece-title" className="h-section">
            <RevealWords text={ONE_PIECE.title} />
          </h2>
        </div>
        <div className="lg:col-span-5">
          <Reveal delay={0.15} as="p" className="prose-lede">
            {ONE_PIECE.lede}
          </Reveal>
        </div>
      </div>

      <Reveal delay={0.1} className="mt-10 md:mt-12">
        <GearFive />
      </Reveal>

      {/* The story, told as you scroll: two beats, then the turn. */}
      <div className="mt-14 grid gap-8 md:mt-20 md:grid-cols-2 md:gap-12">
        {ONE_PIECE.body.map((p, i) => (
          <Reveal key={i} delay={i * 0.12} className="relative pl-6">
            <span aria-hidden="true" className="absolute top-1.5 left-0 h-[calc(100%-0.5rem)] w-px bg-[linear-gradient(180deg,var(--env-accent),transparent)]" />
            <p className="label mb-3 text-[var(--env-tint)]">{i === 0 ? 'Carefree' : 'Not careless'}</p>
            <p className="prose-lede">{p}</p>
          </Reveal>
        ))}
      </div>

      <Reveal className="mx-auto mt-14 max-w-[52rem] text-center md:mt-20">
        <p className="prose-lede mx-auto">{ONE_PIECE.turn}</p>
        <p className="serif mt-5 text-[clamp(1.6rem,1.2rem+1.6vw,2.6rem)] leading-[1.2] text-[var(--color-ink)]">
          {ONE_PIECE.thesis}
        </p>
        <span aria-hidden="true" className="draw-x mx-auto mt-6 block h-px w-40 bg-[linear-gradient(90deg,transparent,#ffd48a,var(--env-accent),transparent)]" />
      </Reveal>

      <div className="mt-14 grid gap-5 md:mt-20 lg:grid-cols-12 lg:gap-6">
        <Reveal className="lg:col-span-5">
          <StrawHat />
        </Reveal>
        <Reveal delay={0.12} className="lg:col-span-7">
          <Lessons />
        </Reveal>
      </div>

      <Reveal as="p" className="mt-8 text-[0.78rem] text-[var(--color-ink-faint)]">
        One Piece artwork © Eiichiro Oda / Shueisha, Toei Animation — shown here as a fan.
      </Reveal>
    </SectionShell>
  );
}
