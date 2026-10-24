import { useId } from 'react';
import { mulberry32 } from '../lib/utils';
import { canopy } from '../lib/shapes';

/** Gradient ids must be unique per instance: the same artwork can be on
    screen twice (a cross-fade, or a game card over its own backdrop), and
    `url(#id)` resolves to whichever copy comes first in the document. */
const useSvgId = () => useId().replace(/[^a-zA-Z0-9]/g, '');

/**
 * Original, procedurally drawn environment art. Nothing here is traced from
 * or hotlinked to anyone's artwork — every shape is generated from code, so
 * it is safe to ship and cheap to render.
 */

interface Branch { d: string; w: number; depth: number }

function growTree(maxDepth: number): Branch[] {
  const rnd = mulberry32(24);
  const out: Branch[] = [];
  const grow = (x: number, y: number, angle: number, len: number, width: number, depth: number) => {
    if (depth > maxDepth || len < 9) return;
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

/* Two levels of detail: a phone mounts this artwork mid-transition, and every
   path it does not have to build is a frame it does not drop. */
const TREE_FULL = growTree(6);
const TREE_LITE = growTree(4);

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
  /** Small screens get a lighter version of the same composition. */
  lite?: boolean;
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
export const TreeScape = ({ align, lite }: ScapeProps = {}) => {
  const u = useSvgId();
  return (
  <Frame align={align}>
    <defs>
      <radialGradient id={`${u}tree-halo`} cx="50%" cy="72%" r="46%">
        <stop offset="0%" stopColor="var(--env-accent)" stopOpacity="0.15" />
        <stop offset="60%" stopColor="var(--env-ray)" stopOpacity="0.07" />
        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${u}tree-fade`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--env-accent)" stopOpacity="0.85" />
        <stop offset="100%" stopColor="var(--env-accent)" stopOpacity="0.25" />
      </linearGradient>
    </defs>
    <rect width="1440" height="900" fill={`url(#${u}tree-halo)`} />
    <g stroke={`url(#${u}tree-fade)`} fill="none" strokeLinecap="round">
      {(lite ? TREE_LITE : TREE_FULL).map((b, i) => (
        <path key={i} d={b.d} strokeWidth={b.w} opacity={0.12 + b.depth * 0.03} />
      ))}
    </g>
    <path d={ridge(7, 830, 90)} fill="var(--env-void)" opacity="0.9" />
    <path d={ridge(11, 872, 46)} fill="#000" opacity="0.7" />
  </Frame>
);
};

/** Sekiro — moonlight over distant ridges. */
export const MoonScape = ({ align }: ScapeProps = {}) => {
  const u = useSvgId();
  return (
  <Frame align={align}>
    <defs>
      <radialGradient id={`${u}moon-glow`} cx="80%" cy="20%" r="30%">
        <stop offset="0%" stopColor="#ffe9d8" stopOpacity="0.34" />
        <stop offset="45%" stopColor="var(--env-accent)" stopOpacity="0.14" />
        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect width="1440" height="900" fill={`url(#${u}moon-glow)`} />
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
};

/** God of War Ragnarök — cold peaks and an old carved ring. */
export const NorthScape = ({ align }: ScapeProps = {}) => {
  const u = useSvgId();
  return (
  <Frame align={align}>
    <defs>
      <linearGradient id={`${u}north-haze`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--env-accent)" stopOpacity="0.16" />
        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
      </linearGradient>
    </defs>
    <rect y="220" width="1440" height="480" fill={`url(#${u}north-haze)`} />
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
};

/** Black Myth: Wukong — layered peaks lost in mist. */
export const MountainScape = ({ align }: ScapeProps = {}) => {
  const u = useSvgId();
  return (
  <Frame align={align}>
    <defs>
      <radialGradient id={`${u}peak-glow`} cx="68%" cy="34%" r="46%">
        <stop offset="0%" stopColor="var(--env-accent)" stopOpacity="0.22" />
        <stop offset="60%" stopColor="var(--env-ray)" stopOpacity="0.08" />
        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${u}mist-band`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="transparent" stopOpacity="0" />
        <stop offset="50%" stopColor="var(--env-accent)" stopOpacity="0.13" />
        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
      </linearGradient>
    </defs>
    <rect width="1440" height="900" fill={`url(#${u}peak-glow)`} />
    <path d={peaks(2, 640, 330, 5)} fill="color-mix(in oklab, var(--env-void) 72%, black)" opacity="0.75" />
    <rect y="520" width="1440" height="150" fill={`url(#${u}mist-band)`} />
    <path d={peaks(12, 760, 250, 6)} fill="color-mix(in oklab, var(--env-void) 88%, black)" opacity="0.92" />
    <rect y="660" width="1440" height="130" fill={`url(#${u}mist-band)`} />
    <g opacity="0.55" fill="var(--env-void)">
      <path d="M1140 792 L1140 700 L1128 700 L1176 664 L1224 700 L1212 700 L1212 792 Z" />
      <path d="M1104 706 h144 l-16 20 h-112 Z" />
      <path d="M1120 662 h112 l-14 16 h-84 Z" />
    </g>
    <path d={ridge(19, 800, 90)} fill="var(--env-void)" opacity="0.92" />
    <path d={ridge(23, 874, 40)} fill="#000" opacity="0.78" />
  </Frame>
);
};

/** Monster Hunter: World — an ancient tree over a forest, something big in the sky. */
export const WildScape = ({ align, lite }: ScapeProps = {}) => {
  const u = useSvgId();
  return (
  <Frame align={align}>
    <defs>
      <radialGradient id={`${u}wild-sun`} cx="74%" cy="24%" r="42%">
        <stop offset="0%" stopColor="#ffe2a6" stopOpacity="0.2" />
        <stop offset="45%" stopColor="var(--env-accent)" stopOpacity="0.08" />
        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${u}wild-mist`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="transparent" stopOpacity="0" />
        <stop offset="55%" stopColor="var(--env-accent)" stopOpacity="0.1" />
        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
      </linearGradient>
    </defs>
    <rect width="1440" height="900" fill={`url(#${u}wild-sun)`} />
    <g fill="color-mix(in oklab, var(--env-a) 70%, var(--env-accent))" opacity="0.3">
      <path d="M330 900 C352 760 348 600 316 470 C306 430 340 420 352 460 C384 560 408 700 420 900 Z" />
      <path d={canopy(41, 360, 330, 330, 190, lite ? 7 : 11)} />
    </g>
    <path d={ridge(52, 690, 120, 22)} fill="color-mix(in oklab, var(--env-a) 85%, var(--env-accent))" opacity="0.55" />
    <rect y="560" width="1440" height="170" fill={`url(#${u}wild-mist)`} />
    <path d={ridge(58, 790, 70, 30)} fill="var(--env-void)" opacity="0.9" />
    <path d={ridge(61, 876, 40)} fill="#000" opacity="0.75" />
  </Frame>
);
};

/** Driving — a city seen from the road at night. */
export const CityScape = ({ align, lite }: ScapeProps = {}) => {
  const u = useSvgId();
  const rnd = mulberry32(77);
  const towers = Array.from({ length: lite ? 16 : 26 }, (_, i) => {
    const w = 26 + rnd() * 58;
    const x = i * (lite ? 94 : 58) - 30 + rnd() * 12;
    const h = 80 + rnd() * 250;
    return { x, w, h, windows: Math.floor(h / (lite ? 44 : 26)) };
  });
  return (
    <Frame align={align}>
      <defs>
        <linearGradient id={`${u}city-glow`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="transparent" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--env-accent)" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <rect y="380" width="1440" height="300" fill={`url(#${u}city-glow)`} />
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
export const NatureScape = ({ align, lite }: ScapeProps = {}) => {
  const u = useSvgId();
  const rnd = mulberry32(41);
  return (
    <Frame align={align}>
      <defs>
        <radialGradient id={`${u}sun`} cx="26%" cy="62%" r="30%">
          <stop offset="0%" stopColor="#ffd9a0" stopOpacity="0.55" />
          <stop offset="45%" stopColor="var(--env-accent)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1440" height="900" fill={`url(#${u}sun)`} />
      <circle cx="374" cy="558" r="60" fill="#ffca86" opacity="0.42" />
      <path d={ridge(6, 700, 70)} fill="var(--env-a)" opacity="0.8" />
      <g fill="var(--env-void)" opacity="0.85">
        {Array.from({ length: lite ? 7 : 11 }).map((_, i) => {
          const x = 60 + i * (lite ? 200 : 132) + rnd() * 40;
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
        {Array.from({ length: lite ? 26 : 54 }).map((_, i) => {
          const x = rnd() * 1440;
          const h = 24 + rnd() * 46;
          return <path key={i} d={`M${x.toFixed(0)} 900 q${(rnd() * 16 - 8).toFixed(0)} ${-h / 2} ${(rnd() * 20 - 10).toFixed(0)} ${-h}`} fill="none" />;
        })}
      </g>
    </Frame>
  );
};

/** Automation — a quiet circuit horizon. */
export const CircuitScape = ({ align, lite }: ScapeProps = {}) => {
  const rnd = mulberry32(88);
  const lines = Array.from({ length: lite ? 10 : 18 }, () => {
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
        {Array.from({ length: lite ? 14 : 26 }).map((_, i) => (
          <circle key={i} cx={rnd() * 1440} cy={260 + rnd() * 620} r={1.6} />
        ))}
      </g>
    </Frame>
  );
};

/** Home, About, Outro — no landmark, just distance. */
/* Deep space: the curved limb of a planet low in the frame, its atmosphere
   catching the chapter's light. Layered strokes give the soft rim without a
   blur filter. */
export const HorizonScape = ({ align }: ScapeProps = {}) => {
  const u = useSvgId();
  return (
  <Frame align={align}>
    <defs>
      <radialGradient id={`${u}hz-glow`} cx="50%" cy="100%" r="70%">
        <stop offset="0%" stopColor="var(--env-accent)" stopOpacity="0.16" />
        <stop offset="50%" stopColor="var(--env-ray)" stopOpacity="0.08" />
        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${u}hz-rim`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="var(--env-accent)" stopOpacity="0" />
        <stop offset="35%" stopColor="var(--env-accent)" stopOpacity="0.55" />
        <stop offset="65%" stopColor="var(--env-glow)" stopOpacity="0.5" />
        <stop offset="100%" stopColor="var(--env-glow)" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${u}hz-body`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--env-a)" />
        <stop offset="35%" stopColor="#020309" />
      </linearGradient>
    </defs>
    <rect width="1440" height="900" fill={`url(#${u}hz-glow)`} />
    <g fill="none" stroke={`url(#${u}hz-rim)`}>
      <circle cx="720" cy="2620" r="1830" strokeWidth="40" strokeOpacity="0.05" />
      <circle cx="720" cy="2620" r="1830" strokeWidth="16" strokeOpacity="0.12" />
      <circle cx="720" cy="2620" r="1830" strokeWidth="5" strokeOpacity="0.35" />
    </g>
    <circle cx="720" cy="2620" r="1828" fill={`url(#${u}hz-body)`} />
    <circle cx="720" cy="2620" r="1830" fill="none" stroke={`url(#${u}hz-rim)`} strokeWidth="1.2" />
  </Frame>
);
};
