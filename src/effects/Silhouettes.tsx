/**
 * Original, procedurally drawn environment art. Nothing here is traced from
 * or hotlinked to anyone's artwork — every shape is generated from code, so
 * it is safe to ship and cheap to render.
 */

const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

interface Branch { d: string; w: number; depth: number }

function growTree(): Branch[] {
  const rnd = mulberry32(24);
  const out: Branch[] = [];
  const grow = (x: number, y: number, angle: number, len: number, width: number, depth: number) => {
    if (depth > 6 || len < 9) return;
    const spread = 0.42 + rnd() * 0.3;
    const ex = x + Math.cos(angle) * len;
    const ey = y + Math.sin(angle) * len;
    const cx = x + Math.cos(angle - 0.12) * len * 0.55;
    const cy = y + Math.sin(angle - 0.12) * len * 0.55;
    out.push({ d: `M${x.toFixed(1)} ${y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`, w: width, depth });
    const kids = depth < 2 ? 2 : rnd() > 0.3 ? 2 : 3;
    for (let i = 0; i < kids; i++) {
      const dir = kids === 2 ? (i === 0 ? -1 : 1) : i - 1;
      grow(ex, ey, angle + dir * spread * (0.6 + rnd() * 0.7), len * (0.66 + rnd() * 0.14), width * 0.63, depth + 1);
    }
  };
  grow(720, 900, -Math.PI / 2, 190, 26, 0);
  return out;
}

const TREE = growTree();

const ridge = (seed: number, base: number, amp: number, steps = 14) => {
  const rnd = mulberry32(seed);
  let d = `M0 900 L0 ${base}`;
  for (let i = 0; i <= steps; i++) {
    const x = (1440 / steps) * i;
    const y = base - Math.sin((i / steps) * Math.PI) * amp * (0.55 + rnd() * 0.75);
    d += ` L${x.toFixed(0)} ${y.toFixed(0)}`;
  }
  return `${d} L1440 900 Z`;
};

const peaks = (seed: number, base: number, amp: number, count = 7) => {
  const rnd = mulberry32(seed);
  let d = `M0 900 L0 ${base}`;
  for (let i = 0; i <= count; i++) {
    const x = (1440 / count) * i;
    const peak = base - amp * (0.4 + rnd() * 0.9);
    d += ` L${(x - 1440 / count / 2).toFixed(0)} ${peak.toFixed(0)} L${x.toFixed(0)} ${(base - amp * 0.15 * rnd()).toFixed(0)}`;
  }
  return `${d} L1440 900 Z`;
};

export interface ScapeProps {
  /** Lets a narrow card crop to the interesting part of the scene. */
  align?: string;
}

const Frame = ({ children, align = 'xMidYMax slice' }: { children: React.ReactNode; align?: string }) => (
  <svg
    viewBox="0 0 1440 900"
    preserveAspectRatio={align}
    aria-hidden="true"
    className="absolute inset-0 h-full w-full"
  >
    {children}
  </svg>
);

/** Elden Ring — a vast, distant, glowing tree. */
export const TreeScape = ({ align }: ScapeProps = {}) => (
  <Frame align={align}>
    <defs>
      <radialGradient id="tree-halo" cx="50%" cy="72%" r="46%">
        <stop offset="0%" stopColor="var(--env-accent)" stopOpacity="0.15" />
        <stop offset="60%" stopColor="var(--env-ray)" stopOpacity="0.07" />
        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="tree-fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--env-accent)" stopOpacity="0.85" />
        <stop offset="100%" stopColor="var(--env-accent)" stopOpacity="0.25" />
      </linearGradient>
    </defs>
    <rect width="1440" height="900" fill="url(#tree-halo)" />
    <g stroke="url(#tree-fade)" fill="none" strokeLinecap="round" className="art-glow">
      {TREE.map((b, i) => (
        <path key={i} d={b.d} strokeWidth={b.w} opacity={0.12 + b.depth * 0.03} />
      ))}
    </g>
    <path d={ridge(7, 830, 90)} fill="var(--env-void)" opacity="0.9" />
    <path d={ridge(11, 872, 46)} fill="#000" opacity="0.7" />
  </Frame>
);

/** Sekiro — moonlight over distant ridges. */
export const MoonScape = ({ align }: ScapeProps = {}) => (
  <Frame align={align}>
    <defs>
      <radialGradient id="moon-glow" cx="80%" cy="20%" r="30%">
        <stop offset="0%" stopColor="#ffe9d8" stopOpacity="0.34" />
        <stop offset="45%" stopColor="var(--env-accent)" stopOpacity="0.14" />
        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect width="1440" height="900" fill="url(#moon-glow)" />
    <circle cx="1148" cy="176" r="62" fill="#ffeadb" opacity="0.34" />
    <circle cx="1148" cy="176" r="62" fill="none" stroke="var(--env-accent)" strokeOpacity="0.3" strokeWidth="1.2" />
    <path d={ridge(3, 700, 150)} fill="var(--env-a)" opacity="0.85" />
    <path d={ridge(9, 790, 110)} fill="var(--env-void)" opacity="0.9" />
    <g stroke="var(--env-void)" strokeWidth="7" opacity="0.75">
      {[110, 168, 232, 1290, 1352].map((x, i) => (
        <path key={i} d={`M${x} 900 C${x - 16} 640 ${x + 18} 520 ${x - 6} 360`} fill="none" />
      ))}
    </g>
    <path d={ridge(15, 880, 40)} fill="#000" opacity="0.75" />
  </Frame>
);

/** God of War — cold peaks and an old carved ring. */
export const NorthScape = ({ align }: ScapeProps = {}) => (
  <Frame align={align}>
    <defs>
      <linearGradient id="north-haze" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--env-accent)" stopOpacity="0.16" />
        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
      </linearGradient>
    </defs>
    <rect y="220" width="1440" height="480" fill="url(#north-haze)" />
    <g opacity="0.22" stroke="var(--env-accent)" fill="none" strokeWidth="1.4">
      <circle cx="720" cy="330" r="152" />
      <circle cx="720" cy="330" r="126" strokeDasharray="7 13" />
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return (
          <line
            key={i}
            x1={720 + Math.cos(a) * 128}
            y1={330 + Math.sin(a) * 128}
            x2={720 + Math.cos(a) * 152}
            y2={330 + Math.sin(a) * 152}
          />
        );
      })}
    </g>
    <path d={peaks(5, 720, 300)} fill="var(--env-a)" opacity="0.9" />
    <path d={peaks(21, 800, 210)} fill="var(--env-void)" opacity="0.92" />
    <path d={ridge(31, 878, 44)} fill="#000" opacity="0.8" />
  </Frame>
);

/** Black Myth: Wukong — layered peaks lost in mist. */
export const MountainScape = ({ align }: ScapeProps = {}) => (
  <Frame align={align}>
    <defs>
      <radialGradient id="peak-glow" cx="68%" cy="34%" r="46%">
        <stop offset="0%" stopColor="var(--env-accent)" stopOpacity="0.22" />
        <stop offset="60%" stopColor="var(--env-ray)" stopOpacity="0.08" />
        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="mist-band" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="transparent" stopOpacity="0" />
        <stop offset="50%" stopColor="var(--env-accent)" stopOpacity="0.13" />
        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
      </linearGradient>
    </defs>
    <rect width="1440" height="900" fill="url(#peak-glow)" />
    <path d={peaks(2, 640, 330, 5)} fill="color-mix(in oklab, var(--env-void) 72%, black)" opacity="0.75" />
    <rect y="520" width="1440" height="150" fill="url(#mist-band)" />
    <path d={peaks(12, 760, 250, 6)} fill="color-mix(in oklab, var(--env-void) 88%, black)" opacity="0.92" />
    <rect y="660" width="1440" height="130" fill="url(#mist-band)" />
    <g opacity="0.55" fill="var(--env-void)">
      <path d="M1140 792 L1140 700 L1128 700 L1176 664 L1224 700 L1212 700 L1212 792 Z" />
      <path d="M1104 706 h144 l-16 20 h-112 Z" />
      <path d="M1120 662 h112 l-14 16 h-84 Z" />
    </g>
    <path d={ridge(19, 800, 90)} fill="var(--env-void)" opacity="0.92" />
    <path d={ridge(23, 874, 40)} fill="#000" opacity="0.78" />
  </Frame>
);

/** Driving — a city seen from the road at night. */
export const CityScape = ({ align }: ScapeProps = {}) => {
  const rnd = mulberry32(77);
  const towers = Array.from({ length: 26 }, (_, i) => {
    const w = 26 + rnd() * 58;
    const x = i * 58 - 30 + rnd() * 12;
    const h = 80 + rnd() * 250;
    return { x, w, h, windows: Math.floor(h / 26) };
  });
  return (
    <Frame align={align}>
      <defs>
        <linearGradient id="city-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="transparent" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--env-accent)" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <rect y="380" width="1440" height="300" fill="url(#city-glow)" />
      <g>
        {towers.map((t, i) => (
          <g key={i}>
            <rect x={t.x} y={680 - t.h} width={t.w} height={t.h} fill="var(--env-void)" opacity="0.95" />
            {Array.from({ length: t.windows }).map((_, j) =>
              rnd() > 0.62 ? (
                <rect
                  key={j}
                  x={t.x + 7}
                  y={680 - t.h + 12 + j * 24}
                  width={t.w - 14}
                  height={5}
                  fill="var(--env-accent)"
                  opacity={0.18 + rnd() * 0.4}
                />
              ) : null,
            )}
          </g>
        ))}
      </g>
      <rect y="676" width="1440" height="224" fill="#000" opacity="0.6" />
    </Frame>
  );
};

/** Walks — hills, trees and late sun. */
export const NatureScape = ({ align }: ScapeProps = {}) => {
  const rnd = mulberry32(41);
  return (
    <Frame align={align}>
      <defs>
        <radialGradient id="sun" cx="26%" cy="62%" r="30%">
          <stop offset="0%" stopColor="#ffd9a0" stopOpacity="0.55" />
          <stop offset="45%" stopColor="var(--env-accent)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1440" height="900" fill="url(#sun)" />
      <circle cx="374" cy="558" r="60" fill="#ffca86" opacity="0.42" />
      <path d={ridge(6, 700, 70)} fill="var(--env-a)" opacity="0.8" />
      <g fill="var(--env-void)" opacity="0.85">
        {Array.from({ length: 11 }).map((_, i) => {
          const x = 60 + i * 132 + rnd() * 40;
          const h = 90 + rnd() * 90;
          return (
            <g key={i}>
              <rect x={x - 4} y={760 - h * 0.35} width="8" height={h * 0.4} />
              <ellipse cx={x} cy={760 - h * 0.55} rx={26 + rnd() * 22} ry={34 + rnd() * 26} />
            </g>
          );
        })}
      </g>
      <path d={ridge(14, 800, 50)} fill="var(--env-void)" opacity="0.9" />
      <g stroke="#000" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round">
        {Array.from({ length: 54 }).map((_, i) => {
          const x = rnd() * 1440;
          const h = 24 + rnd() * 46;
          return <path key={i} d={`M${x.toFixed(0)} 900 q${(rnd() * 16 - 8).toFixed(0)} ${-h / 2} ${(rnd() * 20 - 10).toFixed(0)} ${-h}`} fill="none" />;
        })}
      </g>
    </Frame>
  );
};

/** Automation — a quiet circuit horizon. */
export const CircuitScape = ({ align }: ScapeProps = {}) => {
  const rnd = mulberry32(88);
  const lines = Array.from({ length: 18 }, () => {
    const y = 300 + rnd() * 560;
    const x = rnd() * 1440;
    const len = 120 + rnd() * 300;
    const up = rnd() > 0.5 ? -1 : 1;
    return `M${x.toFixed(0)} ${y.toFixed(0)} h${(len * 0.5).toFixed(0)} l${(40 * up).toFixed(0)} ${(-40 * up).toFixed(0)} h${(len * 0.5).toFixed(0)}`;
  });
  return (
    <Frame align={align}>
      <g stroke="var(--env-accent)" fill="none" strokeWidth="1" opacity="0.14">
        {lines.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <g fill="var(--env-accent)" opacity="0.2">
        {Array.from({ length: 26 }).map((_, i) => (
          <circle key={i} cx={rnd() * 1440} cy={260 + rnd() * 620} r={1.6} />
        ))}
      </g>
    </Frame>
  );
};

/** Home, About, Outro — no landmark, just distance. */
export const HorizonScape = ({ align }: ScapeProps = {}) => (
  <Frame align={align}>
    <defs>
      <radialGradient id="hz-glow" cx="50%" cy="104%" r="62%">
        <stop offset="0%" stopColor="var(--env-accent)" stopOpacity="0.2" />
        <stop offset="55%" stopColor="var(--env-ray)" stopOpacity="0.09" />
        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="hz-line" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="var(--env-accent)" stopOpacity="0" />
        <stop offset="50%" stopColor="var(--env-accent)" stopOpacity="0.3" />
        <stop offset="100%" stopColor="var(--env-accent)" stopOpacity="0" />
      </linearGradient>
    </defs>
    <rect width="1440" height="900" fill="url(#hz-glow)" />
    <rect x="0" y="742" width="1440" height="1.4" fill="url(#hz-line)" />
    <rect x="0" y="744" width="1440" height="156" fill="#000" opacity="0.4" />
  </Frame>
);
