import { memo, useCallback, useEffect, useState } from 'react';
import { GAME_MAP, GAME_WORLDS, type GameWorld } from '../data/worlds';
import { useActions, useDevice, useEnv } from '../state/hooks';
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
const WorldCard = memo(function WorldCard({
  world,
  index,
  active,
  onSelect,
}: {
  world: GameWorld;
  index: number;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const { onPointerMove, onPointerLeave, enabled } = useTilt<HTMLButtonElement>(7);
  const Art = ART[world.art];

  return (
    <button
      type="button"
      onClick={() => onSelect(world.id)}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      aria-pressed={active}
      aria-label={`${world.title} — ${world.genre}, ${world.year}`}
      className={cn(
        'group relative aspect-[3/4] w-full overflow-hidden rounded-2xl text-left',
        'border transition-[border-color,box-shadow,transform] duration-500 ease-[var(--ease-out-expo)] focus-visible:outline-offset-4 active:scale-[0.985]',
        active
          ? 'border-[color-mix(in_oklab,var(--w-accent)_70%,transparent)] shadow-[0_30px_80px_-40px_var(--w-accent)]'
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
        transform: enabled ? 'perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))' : undefined,
        background: `linear-gradient(180deg, ${world.theme.a}, ${world.theme.void})`,
      }}
    >
      {world.image ? (
        <img
          src={world.image}
          alt=""
          loading="lazy"
          decoding="async"
          className={cn('absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-700', active ? 'scale-105 opacity-70' : 'opacity-40 group-hover:opacity-60')}
        />
      ) : (
        <div
          className={cn(
            'absolute inset-0 transition-[opacity,transform] duration-700',
            active ? 'scale-105 opacity-100' : 'opacity-60 group-hover:scale-[1.03] group-hover:opacity-90',
          )}
        >
          <Art align={CROP[world.art]} />
        </div>
      )}

      <div aria-hidden="true" className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 35%, ${world.theme.void}dd 78%, ${world.theme.void} 100%)` }} />

      {enabled && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: 'radial-gradient(240px circle at var(--gx, 50%) var(--gy, 50%), color-mix(in oklab, var(--w-accent) 24%, transparent), transparent 70%)' }}
        />
      )}

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-4 md:p-5">
        <span className="font-mono text-[0.64rem] tracking-[0.24em] uppercase" style={{ color: world.theme.accent }}>
          {String(index + 1).padStart(2, '0')} · {world.year}
        </span>
        <span className="font-display text-[0.98rem] leading-tight font-normal tracking-[-0.01em] text-white md:text-[1.06rem]">{world.short}</span>
        <span
          className={cn('font-mono text-[0.62rem] tracking-[0.2em] uppercase transition-opacity duration-500', active ? 'opacity-90' : 'opacity-0 group-hover:opacity-70')}
          style={{ color: world.theme.tint }}
        >
          {active ? 'Now showing' : 'Enter world'}
        </span>
      </div>

      {active && (
        <span
          aria-hidden="true"
          className="absolute top-4 right-4 h-2 w-2 rotate-45"
          style={{ background: world.theme.accent, boxShadow: `0 0 18px ${world.theme.accent}`, animation: 'pop-in 400ms var(--ease-out-expo) both' }}
        />
      )}
    </button>
  );
});

export default function Games() {
  const { setOverride } = useActions();
  const { active } = useEnv();
  const { compact } = useDevice();
  const [selected, setSelected] = useState<string>(GAME_WORLDS[0].id);
  const select = useCallback((id: string) => setSelected(id), []);
  const world = GAME_MAP[selected];

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
            I like games that feel like an experience rather than something to pass the time — story-driven worlds, difficult
            combat, and places that stay in your head long after the credits.
          </Reveal>
        </div>
      </div>

      <Reveal delay={0.2} className="mt-10 flex items-center gap-4">
        <p className="eyebrow">{compact ? 'Tap a world' : 'Choose a world'}</p>
        <span className="hairline h-px flex-1" />
        <p className="eyebrow hidden opacity-70 sm:block">The site changes with it</p>
      </Reveal>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {GAME_WORLDS.map((g, i) => (
          <Reveal key={g.id} delay={0.06 * i}>
            <WorldCard world={g} index={i} active={g.id === selected} onSelect={select} />
          </Reveal>
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
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
