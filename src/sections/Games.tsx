import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { GAME_MAP, GAME_WORLDS, type GameWorld } from '../data/worlds';
import { useExperience } from '../state/experience';
import { useTilt } from '../hooks/useTilt';
import Reveal, { RevealWords } from '../components/ui/Reveal';
import SectionShell from '../components/ui/SectionShell';
import { MoonScape, MountainScape, NorthScape, TreeScape } from '../effects/Silhouettes';
import { cn } from '../lib/utils';

const ART = { tree: TreeScape, moon: MoonScape, north: NorthScape, mountain: MountainScape };
/** Portrait cards crop hard, so each world names the part worth keeping. */
const CROP: Record<string, string> = {
  tree: 'xMidYMax slice',
  moon: 'xMaxYMax slice',
  north: 'xMidYMax slice',
  mountain: 'xMaxYMax slice',
};

/** Each card renders the same procedural art in its own world's palette. */
function WorldCard({
  world,
  index,
  active,
  onSelect,
}: {
  world: GameWorld;
  index: number;
  active: boolean;
  onSelect: () => void;
}) {
  const { rotateX, rotateY, glareX, glareY, onPointerMove, onPointerLeave, enabled } = useTilt(7);
  const Art = ART[world.art];

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      aria-pressed={active}
      className={cn(
        'group relative aspect-[3/4] w-full overflow-hidden rounded-2xl text-left',
        'border transition-[border-color,box-shadow] duration-500 focus-visible:outline-offset-4',
        active
          ? 'border-[color-mix(in_oklab,var(--w-accent)_65%,transparent)] shadow-[0_30px_80px_-40px_var(--w-accent)]'
          : 'border-[color-mix(in_oklab,var(--w-accent)_18%,transparent)] hover:border-[color-mix(in_oklab,var(--w-accent)_45%,transparent)]',
      )}
      style={{
        // The card carries its own environment, so the shared art components
        // render in this world's colours.
        ['--w-accent' as string]: world.theme.accent,
        ['--env-accent' as string]: world.theme.accent,
        ['--env-ray' as string]: world.theme.ray,
        ['--env-a' as string]: world.theme.a,
        ['--env-void' as string]: world.theme.void,
        rotateX: enabled ? rotateX : 0,
        rotateY: enabled ? rotateY : 0,
        transformPerspective: 900,
        background: `linear-gradient(180deg, ${world.theme.a}, ${world.theme.void})`,
      }}
      whileTap={{ scale: 0.985 }}
    >
      {world.image ? (
        <img
          src={world.image}
          alt=""
          loading="lazy"
          decoding="async"
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-all duration-700',
            active ? 'scale-105 opacity-70 blur-0' : 'scale-100 opacity-40 blur-[2px] group-hover:opacity-60',
          )}
        />
      ) : (
        <div
          className={cn(
            'absolute inset-0 transition-all duration-700 will-change-transform',
            active ? 'scale-105 opacity-100' : 'scale-100 opacity-65 group-hover:scale-[1.03] group-hover:opacity-90',
          )}
        >
          <Art align={CROP[world.art]} />
        </div>
      )}

      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: `linear-gradient(180deg, transparent 35%, ${world.theme.void}dd 78%, ${world.theme.void} 100%)` }}
      />

      {enabled && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: 'radial-gradient(240px circle at var(--gx) var(--gy), color-mix(in oklab, var(--w-accent) 24%, transparent), transparent 70%)',
            ['--gx' as string]: glareX,
            ['--gy' as string]: glareY,
          }}
        />
      )}

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-4 md:p-5">
        <span className="font-mono text-[0.6rem] tracking-[0.28em] uppercase" style={{ color: world.theme.accent }}>
          {String(index + 1).padStart(2, '0')} · {world.year}
        </span>
        <span className="text-[1.05rem] leading-tight font-medium text-white md:text-[1.15rem]">{world.short}</span>
        <span
          className={cn(
            'font-mono text-[0.6rem] tracking-[0.2em] uppercase transition-opacity duration-500',
            active ? 'opacity-90' : 'opacity-0 group-hover:opacity-70',
          )}
          style={{ color: world.theme.tint }}
        >
          {active ? 'Now showing' : 'Enter world'}
        </span>
      </div>

      {active && (
        <motion.span
          layoutId="world-marker"
          className="absolute top-4 right-4 h-2 w-2 rounded-full"
          style={{ background: world.theme.accent, boxShadow: `0 0 18px ${world.theme.accent}` }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        />
      )}
    </motion.button>
  );
}

export default function Games() {
  const { setOverride, active, compact } = useExperience();
  const [selected, setSelected] = useState<string>(GAME_WORLDS[0].id);
  const world = GAME_MAP[selected];

  /* Entering the section hands the environment to the selected world. */
  useEffect(() => {
    if (active !== 'games') return;
    setOverride({ theme: world.theme, particles: world.particles });
  }, [active, world, setOverride]);

  return (
    <SectionShell id="games" labelledBy="games-title">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <h2 id="games-title" className="h-section">
            <RevealWords text="Worlds worth getting lost in." />
          </h2>
        </div>
        <div className="lg:col-span-5">
          <Reveal delay={0.15} as="p" className="prose-lede">
            I like games that feel like an experience rather than something to pass the time — story-driven
            worlds, difficult combat, and places that stay in your head long after the credits.
          </Reveal>
        </div>
      </div>

      <Reveal delay={0.2} className="mt-10 flex items-center gap-4">
        <p className="eyebrow">{compact ? 'Tap a world' : 'Choose a world'}</p>
        <span className="hairline h-px flex-1" />
        <p className="eyebrow hidden opacity-70 sm:block">The site changes with it</p>
      </Reveal>

      <div className="mt-5 grid grid-cols-2 gap-3.5 sm:gap-5 lg:grid-cols-4">
        {GAME_WORLDS.map((g, i) => (
          <Reveal key={g.id} delay={0.06 * i} amount={0.2}>
            <WorldCard world={g} index={i} active={g.id === selected} onSelect={() => setSelected(g.id)} />
          </Reveal>
        ))}
      </div>

      <div className="mt-10 min-h-[16rem] lg:mt-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={world.id}
            className="grid gap-8 lg:grid-cols-12"
            initial={{ opacity: 0, y: 22, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -18, filter: 'blur(10px)' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="lg:col-span-7">
              <span className="font-mono text-[0.62rem] tracking-[0.28em] text-[var(--env-accent)] uppercase">
                {world.genre} · {world.year}
              </span>
              <h3 className="display mt-3 text-[clamp(1.7rem,1.2rem+1.8vw,2.6rem)] text-[var(--color-ink)]">
                {world.title}
              </h3>
              <p
                className="mt-3 text-[clamp(1.05rem,1rem+0.4vw,1.35rem)] italic opacity-90"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--env-accent)' }}
              >
                {world.line}
              </p>
            </div>
            <div className="lg:col-span-5">
              <p className="leading-relaxed text-[var(--color-ink-dim)]">{world.note}</p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {world.atmosphere.map((a) => (
                  <li
                    key={a}
                    className="rounded-full border border-[color-mix(in_oklab,var(--env-accent)_26%,transparent)] px-3 py-1.5 font-mono text-[0.6rem] tracking-[0.18em] text-[var(--env-tint)] uppercase"
                  >
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </SectionShell>
  );
}
