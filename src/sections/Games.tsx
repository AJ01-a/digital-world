import { memo, useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { GAME_MAP, GAME_WORLDS, type GameWorld } from '../data/worlds';
import { GAME_ART } from '../data/gameArt';
import { useActions, useDevice, useEnv } from '../state/hooks';
import { observe, useInView } from '../hooks/useInView';
import { useMediaQuery } from '../hooks/useMediaQuery';
import Reveal, { RevealWords } from '../components/ui/Reveal';
import SectionShell from '../components/ui/SectionShell';
import Ecosystem from '../effects/Ecosystem';
import { MoonScape, MountainScape, NorthScape, TreeScape, WildScape } from '../effects/Silhouettes';
import { cn, mulberry32 } from '../lib/utils';

const LIVING = 'monster-hunter-world';
const ART = { tree: TreeScape, moon: MoonScape, north: NorthScape, mountain: MountainScape, wild: WildScape };

/* ── artwork ─────────────────────────────────────────────── */

const base = import.meta.env.BASE_URL;
const srcSet = (id: string, type: 'avif' | 'webp') =>
  GAME_ART[id].widths.map((w) => `${base}games/${id}-${w}.${type} ${w}w`).join(', ');

/** Palette variables, so the procedural fallback art paints in this world's colours. */
const paletteOf = (world: GameWorld): CSSProperties =>
  ({
    '--env-accent': world.theme.accent,
    '--env-ray': world.theme.ray,
    '--env-a': world.theme.a,
    '--env-b': world.theme.b,
    '--env-void': world.theme.void,
  }) as CSSProperties;

/**
 * The game's artwork, from the generated manifest (scripts/game-art.py).
 * A world with no artwork yet — or a file that fails to load — falls back
 * to its procedural scene instead of a broken image.
 */
function Artwork({ world, sizes, className, eager }: { world: GameWorld; sizes: string; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  const Fallback = ART[world.art];

  if (!GAME_ART[world.id] || failed) {
    return (
      <div className={cn('absolute inset-0', className)} style={paletteOf(world)}>
        <Fallback align="xMidYMax slice" />
      </div>
    );
  }
  return (
    <picture>
      <source type="image/avif" srcSet={srcSet(world.id, 'avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(world.id, 'webp')} sizes={sizes} />
      <img
        src={`${base}games/${world.id}-${GAME_ART[world.id].widths[0]}.webp`}
        alt=""
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setFailed(true)}
        className={cn('absolute inset-0 h-full w-full object-cover', className)}
        style={{ objectPosition: world.focus }}
      />
    </picture>
  );
}

/* ── ambient motion, one flavour per world ───────────────── */

type DriftKind = 'embers' | 'petals' | 'snow' | 'motes';
const DRIFT: Record<string, DriftKind> = { 'elden-ring': 'embers', sekiro: 'petals', 'god-of-war': 'snow', 'black-myth-wukong': 'motes' };

const Drift = memo(function Drift({ kind, count }: { kind: DriftKind; count: number }) {
  const rnd = mulberry32(kind.length * 31);
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={`drift-col ${kind === 'snow' || kind === 'petals' ? 'down' : 'up'} x${i % 3}`}
          style={{
            left: `${rnd() * 100}%`,
            animationDuration: `${(kind === 'snow' ? 7 : 9) + rnd() * 8}s`,
            animationDelay: `${-rnd() * 16}s`,
          }}
        >
          <i
            className={`drift drift-${kind}`}
            style={{ ['--s' as string]: `${(kind === 'snow' ? 2 : 2.5) + rnd() * 4}px`, transform: kind === 'petals' ? `rotate(${Math.round(rnd() * 180)}deg)` : undefined }}
          />
        </span>
      ))}
    </div>
  );
});

/* ── the stage ───────────────────────────────────────────── */

interface StageLayer {
  key: number;
  id: string;
}

function Stage({ world, index }: { world: GameWorld; index: number }) {
  const { compact, reducedMotion, finePointer } = useDevice();
  const [watch, near] = useInView<HTMLDivElement>('600px 0px', true);
  // Below desktop widths the stage is too small to float field notes over
  // the scene without covering markers, so they get their own slot under it.
  const narrow = useMediaQuery('(max-width: 1199px)');
  const [notesSlot, setNotesSlot] = useState<HTMLDivElement | null>(null);
  const frame = useRef(0);
  const unobserve = useRef<(() => void) | null>(null);

  // The stage pauses its own animation while it is scrolled out of view,
  // even when the rest of the chapter is still on screen.
  const stageRef = useCallback(
    (el: HTMLDivElement | null) => {
      watch(el);
      unobserve.current?.();
      unobserve.current = el ? observe(el, (e) => el.classList.toggle('is-offscreen', !e.isIntersecting)) : null;
    },
    [watch],
  );

  // The outgoing world stays underneath while the new one arrives.
  const [layers, setLayers] = useState<StageLayer[]>([{ key: 0, id: world.id }]);
  const top = layers[layers.length - 1];
  if (top.id !== world.id) setLayers([top, { key: top.key + 1, id: world.id }]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  // A little depth on desktop: the artwork leans away from the pointer.
  const parallax = finePointer && !reducedMotion;
  const onMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      const y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        el.style.setProperty('--mx', x.toFixed(3));
        el.style.setProperty('--my', y.toFixed(3));
      });
    },
    [],
  );

  return (
    <>
      <div
        ref={stageRef}
        onPointerMove={parallax ? onMove : undefined}
        className="stage relative aspect-square w-full overflow-hidden rounded-2xl border border-[color-mix(in_oklab,var(--env-accent)_26%,transparent)] bg-[var(--env-void)] sm:aspect-[16/9]"
        style={{ boxShadow: '0 40px 120px -60px var(--env-accent)' }}
      >
        {layers.map((l, i) => {
          const w = GAME_MAP[l.id];
          const living = l.id === LIVING;
          return (
            <div
              key={l.key}
              className={cn('absolute inset-0', i > 0 && (living ? 'stage-in stage-in-living' : 'stage-in'))}
              style={paletteOf(w)}
              onAnimationEnd={(e) => {
                if (i === 0 || e.target !== e.currentTarget) return;
                setLayers((ls) => (ls[ls.length - 1].key === l.key ? [l] : ls));
              }}
            >
              {living ? (
                near ? (
                  <Ecosystem lite={compact} still={reducedMotion} notesSlot={narrow ? notesSlot : null} />
                ) : (
                  <Artwork world={w} sizes="(min-width: 640px) 1100px, 100vw" />
                )
              ) : (
                <>
                  <div className="stage-art absolute -inset-[3%]">
                    <div className={cn('absolute inset-0', !reducedMotion && 'art-drift')}>
                      <Artwork world={w} sizes="(min-width: 1180px) 1180px, (min-width: 640px) 92vw, 100vw" />
                    </div>
                  </div>
                  {/* Grade the artwork into the site, and give the caption somewhere to sit. */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(180deg, ${w.theme.void}66 0%, transparent 28%, transparent 55%, ${w.theme.void}e6 100%), radial-gradient(120% 90% at 50% 40%, transparent 55%, ${w.theme.void}b3 100%)`,
                    }}
                  />
                  {!reducedMotion && DRIFT[l.id] && <Drift kind={DRIFT[l.id]} count={compact ? 8 : 16} />}
                </>
              )}
            </div>
          );
        })}

        {/* A sweep of light across the frame each time the world changes. */}
        {!reducedMotion && layers.length > 1 && <span aria-hidden="true" key={top.key} className="stage-sweep pointer-events-none absolute inset-y-0 -left-1/3 w-1/3" />}

        <p className="label pointer-events-none absolute top-4 left-4 text-white/80 sm:top-5 sm:left-5">
          <span style={{ color: world.theme.accent }}>{String(index + 1).padStart(2, '0')}</span>
          <span className="opacity-60"> / {String(GAME_WORLDS.length).padStart(2, '0')}</span>
          <span className="max-sm:hidden"> · {world.title}</span>
        </p>
      </div>
      {/* Height reserved up front, so the notes arriving don't push the page. */}
      {narrow && layers.some((l) => l.id === LIVING) && <div ref={setNotesSlot} className="mt-3 min-h-8" />}
    </>
  );
}

/* ── the index of worlds ─────────────────────────────────── */

const WorldTab = memo(function WorldTab({ world, index, active, onSelect }: { world: GameWorld; index: number; active: boolean; onSelect: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(world.id)}
      aria-pressed={active}
      aria-label={`${world.title} — ${world.genre}, ${world.year}`}
      className="group w-full snap-start text-left focus-visible:outline-offset-4"
      style={{ ['--w-accent' as string]: world.theme.accent }}
    >
      <span
        className={cn(
          'relative block aspect-[16/10] overflow-hidden rounded-xl border transition-[border-color,box-shadow] duration-500',
          active
            ? 'border-[color-mix(in_oklab,var(--w-accent)_75%,transparent)] shadow-[0_18px_50px_-24px_var(--w-accent)]'
            : 'border-white/10 group-hover:border-[color-mix(in_oklab,var(--w-accent)_45%,transparent)]',
        )}
        style={{ background: world.theme.void }}
      >
        <span
          className={cn(
            'absolute inset-0 transition-[opacity,transform] duration-700 ease-[var(--ease-out-expo)]',
            active ? 'opacity-100' : 'opacity-55 group-hover:scale-[1.06] group-hover:opacity-90 group-focus-visible:opacity-90',
          )}
        >
          <Artwork world={world} sizes="(min-width: 1024px) 230px, 45vw" />
        </span>
        <span aria-hidden="true" className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 40%, ${world.theme.void}d9)` }} />
        {/* Revealed on hover: what kind of world it is. */}
        <span
          className={cn(
            'absolute inset-x-3 bottom-2.5 font-mono text-[0.6rem] tracking-[0.18em] uppercase transition-[opacity,transform] duration-500',
            active ? 'opacity-90' : 'translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-80 group-focus-visible:translate-y-0 group-focus-visible:opacity-80',
          )}
          style={{ color: world.theme.tint }}
        >
          {active ? 'Now showing' : world.genre}
        </span>
        {world.id === LIVING && (
          <span className="absolute top-2 right-2 rounded-full bg-black/45 px-2 py-0.5 font-mono text-[0.55rem] tracking-[0.16em] uppercase" style={{ color: world.theme.accent }}>
            Explore
          </span>
        )}
      </span>
      <span className="mt-2.5 flex items-baseline gap-2">
        <span className="font-mono text-[0.62rem] tracking-[0.2em]" style={{ color: world.theme.accent }}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className={cn('truncate text-[0.92rem] transition-colors', active ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-dim)] group-hover:text-[var(--color-ink)]')}>
          {world.short}
        </span>
      </span>
    </button>
  );
});

/* ── the chapter ─────────────────────────────────────────── */

export default function Games() {
  const { setOverride } = useActions();
  const { active } = useEnv();
  const { compact } = useDevice();
  const [selected, setSelected] = useState<string>(GAME_WORLDS[0].id);
  const select = useCallback((id: string) => setSelected(id), []);
  const world = GAME_MAP[selected];
  const index = GAME_WORLDS.indexOf(world);

  /* Entering the section hands the environment to the selected world. */
  useEffect(() => {
    if (active !== 'games') return;
    setOverride({ theme: world.theme, scape: world.art });
  }, [active, world, setOverride]);

  return (
    <SectionShell id="games" labelledBy="games-title" theme={world.theme}>
      <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <h2 id="games-title" className="h-section">
            <RevealWords text="Worlds worth getting lost in." />
          </h2>
        </div>
        <div className="lg:col-span-5">
          <Reveal delay={0.15} as="p" className="prose-lede">
            I like games that feel like an experience rather than something to pass the time — living worlds, stories that stay with
            you, difficult combat, and places that stay in your head long after the credits.
          </Reveal>
        </div>
      </div>

      <Reveal delay={0.15} className="mt-10 md:mt-12">
        <Stage world={world} index={index} />
      </Reveal>

      <Reveal delay={0.2} className="mt-5 flex items-center gap-4">
        <p className="eyebrow">{compact ? 'Tap a world' : 'Choose a world'}</p>
        <span className="hairline h-px flex-1" />
        <p className="eyebrow hidden opacity-70 sm:block">The site changes with it</p>
      </Reveal>

      <div className="no-scrollbar -mx-[var(--shell)] mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-[var(--shell)] px-[var(--shell)] pb-2 sm:mx-0 sm:grid sm:grid-cols-5 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0">
        {GAME_WORLDS.map((g, i) => (
          <div key={g.id} className="w-[40%] shrink-0 sm:w-auto">
            <WorldTab world={g} index={i} active={g.id === selected} onSelect={select} />
          </div>
        ))}
      </div>

      <div className="mt-10 min-h-[16rem] lg:mt-12" aria-live="polite">
        <div key={world.id} className="grid gap-8 lg:grid-cols-12" style={{ animation: 'rise-in 600ms var(--ease-out-expo) both' }}>
          <div className="lg:col-span-7">
            <span className="label text-[var(--env-accent)]">
              {world.genre} · {world.year}
            </span>
            <h3 className="display mt-3 text-[clamp(1.6rem,1.1rem+1.8vw,2.5rem)] text-[var(--color-ink)]">{world.title}</h3>
            <p className="serif mt-3 text-[clamp(1.2rem,1.05rem+0.5vw,1.5rem)]" style={{ color: 'var(--env-accent)' }}>
              {world.line}
            </p>
          </div>
          <div className="lg:col-span-5">
            <p className="leading-relaxed text-[var(--color-ink-dim)]">{world.note}</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {world.atmosphere.map((a) => (
                <li key={a} className="chip">
                  {a}
                </li>
              ))}
            </ul>
            {world.id === LIVING && (
              <div className="mt-6 flex items-center gap-4">
                <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-lg border border-white/10">
                  <Artwork world={world} sizes="96px" />
                </div>
                <p className="text-[0.82rem] leading-relaxed text-[var(--color-ink-faint)]">
                  The scene above is an original illustration drawn in code — not footage or models from the game. Cover art © Capcom.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
