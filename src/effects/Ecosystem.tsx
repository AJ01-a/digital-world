import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn, mulberry32 } from '../lib/utils';
import { canopy } from '../lib/shapes';

/**
 * Monster Hunter: World — a living ecosystem, drawn in code.
 *
 * Not footage, not models: an original illustration of the thing AJ loves
 * about the game — a world that feels alive because creatures of every
 * size share it and react to each other. A wyvern crosses the sky; its
 * shadow sweeps the meadow and the herd looks up; the smallest creature
 * ducks out of sight; birds lift off the ancient tree. On the far ridge,
 * something that looks like rock is breathing.
 *
 * Performance: the landscape is one static SVG, painted once. Everything
 * that moves is its own small element animating only `transform` or
 * `opacity` in CSS (see `.eco-*` in index.css), so the browser composites
 * the motion instead of repainting the scene. All of it pauses when the
 * chapter is off screen, and stands still with reduced motion.
 *
 * The scene is a 1600 × 900 world; `at()` places a layer in it.
 */

const at = (x: number, y: number, w: number, h: number): CSSProperties => ({
  left: `${x / 16}%`,
  top: `${y / 9}%`,
  width: `${w / 16}%`,
  height: `${h / 9}%`,
});

const Layer = ({ box, className, style, children }: { box: CSSProperties; className?: string; style?: CSSProperties; children: ReactNode }) => (
  <div aria-hidden="true" className={cn('absolute', className)} style={{ ...box, ...style }}>
    {children}
  </div>
);

/* ── field notes ─────────────────────────────────────────── */

interface Note {
  id: string;
  /** Marker position in scene units. */
  x: number;
  y: number;
  title: string;
  body: string;
}

const NOTES: Note[] = [
  {
    id: 'tree',
    x: 448,
    y: 300,
    title: 'The ancient tree',
    body: 'Scale, part one. The canopy is so big the mist swallows the trunk, and everything else in this scene lives in its shade.',
  },
  {
    id: 'ridge',
    x: 1330,
    y: 412,
    title: 'The ridge that breathes',
    body: 'Scale, part two. Watch the far ridge for a while — it rises and falls. Some creatures are so large they read as landscape.',
  },
  {
    id: 'sky',
    x: 1010,
    y: 150,
    title: 'Something overhead',
    body: 'Every so often a wyvern crosses the sky. Watch the meadow when it does: its shadow sweeps over the herd, they look up, and the birds lift off the tree.',
  },
  {
    id: 'herd',
    x: 1120,
    y: 606,
    title: 'The herd',
    body: 'Heads down, grazing, until something bigger goes by. The world does not wait for you — it just carries on.',
  },
  {
    id: 'small',
    x: 1222,
    y: 792,
    title: 'Small life',
    body: 'The smallest resident. It ducks behind its rock when the shadow passes, then peeks back out. Details like this make a world feel lived in.',
  },
  {
    id: 'flies',
    x: 250,
    y: 742,
    title: 'Scoutflies',
    body: 'The green lights follow your pointer — or your finger. In Monster Hunter: World, glowing scoutflies lead you along a creature’s tracks.',
  },
];

/* ── artwork ─────────────────────────────────────────────── */

const ridgeLine = (seed: number, base: number, amp: number, steps: number, from = 0, to = 1600) => {
  const rnd = mulberry32(seed);
  let d = `M${from} 900 L${from} ${base}`;
  for (let i = 0; i <= steps; i++) {
    const x = from + ((to - from) / steps) * i;
    d += ` L${x.toFixed(0)} ${(base - amp * (0.3 + rnd() * 0.7)).toFixed(0)}`;
  }
  return `${d} L${to} 900 Z`;
};

/** A line of treetops: rounded crowns along a baseline. */
const treeline = (seed: number, base: number, size: number, from = 0, to = 1600) => {
  const rnd = mulberry32(seed);
  let d = `M${from} 900 L${from} ${base}`;
  let x = from;
  while (x < to) {
    const r = size * (0.6 + rnd() * 0.7);
    d += ` Q${(x + r).toFixed(0)} ${(base - r * (1.4 + rnd())).toFixed(0)} ${(x + r * 2).toFixed(0)} ${base}`;
    x += r * 2;
  }
  return `${d} L${to} 900 Z`;
};

const Landscape = memo(function Landscape({ lite }: { lite: boolean }) {
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 h-full w-full">
      <defs>
        <linearGradient id="eco-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0d211c" />
          <stop offset="0.45" stopColor="#2c5146" />
          <stop offset="0.72" stopColor="#6f9a83" />
          <stop offset="1" stopColor="#8fb294" />
        </linearGradient>
        <radialGradient id="eco-sun" cx="1180" cy="210" r="620" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff1c4" stopOpacity="0.95" />
          <stop offset="0.12" stopColor="#ffd98f" stopOpacity="0.55" />
          <stop offset="0.45" stopColor="#e0b46a" stopOpacity="0.16" />
          <stop offset="1" stopColor="#e0b46a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="eco-haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a8c9b0" stopOpacity="0" />
          <stop offset="0.6" stopColor="#a8c9b0" stopOpacity="0.42" />
          <stop offset="1" stopColor="#a8c9b0" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="eco-meadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7da866" />
          <stop offset="0.35" stopColor="#4a7646" />
          <stop offset="1" stopColor="#18301f" />
        </linearGradient>
        <linearGradient id="eco-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0d1b12" />
          <stop offset="1" stopColor="#040906" />
        </linearGradient>
      </defs>

      <rect width="1600" height="900" fill="url(#eco-sky)" />
      <rect width="1600" height="900" fill="url(#eco-sun)" />
      <circle cx="1180" cy="210" r="40" fill="#fff6dc" opacity="0.9" />

      {/* Far mountains, almost lost in the light. */}
      <path d={ridgeLine(3, 560, 190, 16)} fill="#7fa58f" opacity="0.5" />

      {/* The ancient tree: roots in the mist, crown off the top of the frame. */}
      <g fill="#3d6655">
        <path d="M300 640 C350 610 380 560 384 470 C388 380 372 300 386 220 C396 160 420 110 450 70 L520 70 C522 130 512 200 516 270 C522 360 520 460 540 540 C556 600 600 630 660 650 Z" />
        <path d="M386 230 C330 190 270 170 210 168 L212 158 C276 160 340 178 392 212 Z" />
        <path d="M512 210 C580 170 650 150 720 152 L720 162 C654 162 588 182 516 226 Z" />
        <path d={canopy(91, 450, 92, 470, 120, lite ? 9 : 15)} />
      </g>
      <g stroke="#3d6655" strokeWidth="3" fill="none" opacity="0.8">
        {[250, 300, 610, 660, 700].map((x, i) => (
          <path key={x} d={`M${x} ${150 + i * 6} C${x - 6} ${220 + i * 10} ${x + 8} ${280} ${x} ${330 + i * 14}`} />
        ))}
      </g>
      <rect y="300" width="1600" height="420" fill="url(#eco-haze)" />

      {/* The far ridge (the giant lies along its top — see <Giant>). */}
      <path d="M900 900 L900 520 C980 500 1060 470 1140 466 C1260 462 1400 470 1600 458 L1600 900 Z" fill="#5d8573" opacity="0.85" />

      {/* Forest, then the meadow, then the near ground. */}
      <path d={treeline(17, 610, 26)} fill="#2b4c3c" />
      <path d={treeline(23, 640, 20, 0, 760)} fill="#1f3a2d" />
      <path d="M560 900 L560 700 C700 680 820 652 980 646 C1180 640 1380 628 1600 612 L1600 900 Z" fill="url(#eco-meadow)" />
      <path
        d="M0 900 L0 820 C120 800 220 790 340 800 C420 806 470 784 560 790 C700 800 820 830 980 826 C1100 822 1180 800 1300 806 C1420 812 1520 796 1600 790 L1600 900 Z"
        fill="url(#eco-ground)"
      />
    </svg>
  );
});

/** Long-necked grazer. Body is static; the neck nods (and looks up when the shadow passes). */
const GRAZER_BODY =
  'M18 44 C14 24 46 10 92 10 C126 10 150 22 154 42 C156 56 146 62 132 63 L132 82 L122 82 L118 64 L64 64 L60 82 L50 82 L46 62 C30 60 22 54 18 44 Z ' +
  'M18 42 C4 46 -12 54 -30 56 C-12 50 4 40 18 34 Z';
const GRAZER_PLATES = 'M50 14 l8 -10 l6 8 M74 10 l9 -12 l7 10 M98 10 l9 -11 l7 10 M120 14 l7 -9 l6 9';
const GRAZER_NECK = 'M0 62 C10 40 26 22 46 14 C56 10 70 8 80 12 L84 22 C72 22 62 26 56 32 C42 44 30 58 22 72 Z';

interface GrazerSpec {
  x: number;
  y: number;
  s: number;
  flip?: boolean;
  tone: string;
  /** Grazing rhythm. */
  dur: number;
  delay: number;
}

const HERD: GrazerSpec[] = [
  { x: 860, y: 616, s: 0.72, tone: '#3e6448', dur: 7.2, delay: -1.1 },
  { x: 990, y: 628, s: 0.86, flip: true, tone: '#2f523b', dur: 8.4, delay: -4.6 },
  { x: 1120, y: 624, s: 1, tone: '#25432f', dur: 6.6, delay: -2.4 },
  { x: 1300, y: 612, s: 0.8, flip: true, tone: '#2b4b36', dur: 9.1, delay: -6.2 },
  { x: 1236, y: 666, s: 0.5, tone: '#203a29', dur: 5.4, delay: -0.6 },
];

const Grazer = ({ g }: { g: GrazerSpec }) => {
  const w = 190 * g.s;
  const h = 100 * g.s;
  return (
    <Layer box={at(g.x, g.y, w, h)} style={g.flip ? { transform: 'scaleX(-1)' } : undefined}>
      <svg viewBox="-40 -14 190 100" className="absolute inset-0 h-full w-full overflow-visible">
        <path d={GRAZER_BODY} fill={g.tone} />
        <path d={GRAZER_PLATES} fill="none" stroke={g.tone} strokeWidth="5" strokeLinejoin="round" />
        <path d="M30 18 C60 8 110 6 146 30" fill="none" stroke="#b9d88f" strokeOpacity="0.35" strokeWidth="2" />
      </svg>
      {/* Neck box: pivot at the shoulder (bottom-left). */}
      <div className="eco-alert absolute origin-bottom-left" style={{ left: '87%', top: '-14%', width: '46%', height: '76%' }}>
        <div className="eco-graze h-full w-full origin-bottom-left" style={{ animationDuration: `${g.dur}s`, animationDelay: `${g.delay}s` }}>
          <svg viewBox="0 0 88 76" className="h-full w-full overflow-visible">
            <path d={GRAZER_NECK} fill={g.tone} />
            <circle cx="72" cy="15" r="1.6" fill="#0a120d" />
          </svg>
        </div>
      </div>
    </Layer>
  );
};

/** The wyvern, drawn facing left (it flies right to left). Wings are separate so they can beat. */
const WYVERN_BODY =
  'M8 96 C20 86 34 82 50 84 L58 74 L62 86 C80 88 96 94 112 96 C150 90 196 88 236 96 C280 104 320 112 360 118 L392 112 L384 124 L396 132 L364 128 C318 128 276 124 236 120 C196 126 160 128 120 116 C96 112 76 104 56 102 C40 104 24 104 8 96 Z ' +
  'M150 120 L144 142 L156 146 L162 124 Z M196 122 L194 146 L206 148 L208 124 Z';
const WING = 'M0 150 L58 52 L120 14 L214 0 L190 40 C168 44 156 60 150 76 C126 76 112 92 106 110 C84 110 70 126 64 146 C44 140 20 144 0 150 Z';
const WING_BONES = 'M0 150 L58 52 L120 14 L214 0 M120 14 L150 76 M58 52 L106 110 M30 104 L64 146';

const Wyvern = () => (
  <>
    {/* Its shadow, sweeping the meadow in step with the flight. */}
    <Layer box={at(1000, 664, 300, 46)} className="eco-shadow">
      <div className="h-full w-full rounded-[50%]" style={{ background: 'radial-gradient(closest-side, rgba(4,12,8,0.5), rgba(4,12,8,0))' }} />
    </Layer>
    <Layer box={at(980, 70, 400, 200)} className="eco-fly">
      <div className="eco-wing absolute origin-bottom-left" style={{ left: '40%', top: '-28%', width: '54%', height: '75%', animationDelay: '-0.12s' }}>
        <svg viewBox="0 0 214 150" className="h-full w-full overflow-visible">
          <path d={WING} fill="#16271f" />
        </svg>
      </div>
      <svg viewBox="0 0 400 200" className="absolute inset-0 h-full w-full overflow-visible">
        <path d={WYVERN_BODY} fill="#0d1a14" />
        <path d="M56 84 L44 70 M62 86 L58 70" stroke="#0d1a14" strokeWidth="5" strokeLinecap="round" />
      </svg>
      <div className="eco-wing absolute origin-bottom-left" style={{ left: '34%', top: '-25%', width: '58%', height: '78%' }}>
        <svg viewBox="0 0 214 150" className="h-full w-full overflow-visible">
          <path d={WING} fill="#0b1712" />
          <path d={WING_BONES} fill="none" stroke="#e8c98d" strokeOpacity="0.25" strokeWidth="2" />
        </svg>
      </div>
    </Layer>
  </>
);

/** Rock, or a sleeping giant. It breathes; now and then it lifts its head. */
const Giant = () => (
  <>
    <Layer box={at(1150, 382, 430, 96)} className="eco-breathe origin-bottom">
      <svg viewBox="0 0 430 96" preserveAspectRatio="none" className="h-full w-full">
        <path
          d="M0 96 C20 70 60 52 110 40 L124 22 L132 38 L170 30 L186 8 L194 30 L236 28 L252 6 L260 30 L300 36 L314 18 L320 40 C360 50 400 70 430 96 Z"
          fill="#4f7766"
        />
        <path d="M110 40 L124 22 L132 38 L170 30 L186 8 L194 30 L236 28 L252 6 L260 30 L300 36 L314 18 L320 40" fill="none" stroke="#e7cf98" strokeOpacity="0.35" strokeWidth="2" />
      </svg>
    </Layer>
    <Layer box={at(1096, 414, 92, 54)} className="eco-head origin-bottom-right">
      <svg viewBox="0 0 92 54" className="h-full w-full">
        <path d="M92 54 C80 34 60 24 34 22 L14 14 L20 26 C8 30 2 38 0 46 C24 46 50 48 70 54 Z" fill="#4f7766" />
      </svg>
      {/* The eye opens as the head lifts (an HTML dot, so its fade is composited). */}
      <span className="eco-eye absolute rounded-full bg-[#f5d48a]" style={{ left: '30%', top: '55%', width: '4.4%', height: '7.5%' }} />
    </Layer>
  </>
);

const Birds = () => (
  <Layer box={at(300, 120, 260, 120)} className="eco-birds">
    <svg viewBox="0 0 260 120" className="h-full w-full overflow-visible">
      {[
        [30, 60],
        [80, 30],
        [120, 70],
        [170, 40],
        [210, 80],
        [240, 20],
      ].map(([x, y], i) => (
        <path
          key={i}
          d={`M${x - 9} ${y - 3} Q${x - 4} ${y - 7} ${x} ${y} Q${x + 4} ${y - 7} ${x + 9} ${y - 3}`}
          fill="none"
          stroke="#13241b"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      ))}
    </svg>
  </Layer>
);

/** A fern: arching fronds with leaflets down both sides, in silhouette. */
const Fern = ({ flip }: { flip?: boolean }) => {
  const rnd = mulberry32(flip ? 8 : 5);
  let fronds = '';
  let leaves = '';
  for (let i = 0; i < 7; i++) {
    const a = -1.5 + i * 0.36 + rnd() * 0.12;
    const len = 220 + rnd() * 120;
    const p0 = [150, 420];
    const p1 = [150 + Math.cos(a - 0.45) * len * 0.6, 420 + Math.sin(a - 0.45) * len * 0.6];
    const p2 = [150 + Math.cos(a) * len, 420 + Math.sin(a) * len];
    fronds += `M${p0[0]} ${p0[1]} Q${p1[0].toFixed(0)} ${p1[1].toFixed(0)} ${p2[0].toFixed(0)} ${p2[1].toFixed(0)} `;
    // Leaflets along the curve, shrinking toward the tip.
    for (let k = 3; k < 18; k++) {
      const t = k / 18;
      const u = 1 - t;
      const x = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0];
      const y = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1];
      const dx = 2 * u * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
      const dy = 2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
      const n = Math.hypot(dx, dy);
      const size = 30 * (1 - t) + 6;
      for (const side of [-1, 1]) {
        const nx = (-dy / n) * side;
        const ny = (dx / n) * side;
        const tx = x + nx * size + (dx / n) * size * 0.5;
        const ty = y + ny * size + (dy / n) * size * 0.5;
        leaves += `M${x.toFixed(0)} ${y.toFixed(0)} Q${(x + nx * size * 0.6).toFixed(0)} ${(y + ny * size * 0.6 - 4).toFixed(0)} ${tx.toFixed(0)} ${ty.toFixed(0)} Q${(x + nx * size * 0.4 + (dx / n) * 6).toFixed(0)} ${(y + ny * size * 0.4 + (dy / n) * 6).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)} Z `;
      }
    }
  }
  return (
    <svg viewBox="0 0 300 420" className="h-full w-full overflow-visible" style={flip ? { transform: 'scaleX(-1)' } : undefined}>
      <path d={leaves} fill="#07120b" />
      <path d={fronds} fill="none" stroke="#07120b" strokeWidth="4" />
    </svg>
  );
};

const Critter = () => (
  <>
    <Layer box={at(1196, 770, 56, 46)} className="eco-critter">
      <svg viewBox="0 0 56 46" className="h-full w-full overflow-visible">
        <path d="M6 46 C4 30 12 18 26 16 L22 2 L32 12 L40 2 L40 18 C50 22 54 32 52 46 Z" fill="#14231a" />
        <path d="M52 40 C62 34 66 22 60 14 C66 26 60 36 52 38 Z" fill="#14231a" />
        <circle cx="27" cy="26" r="2.4" fill="#f4e3a8" />
        <circle cx="37" cy="26" r="2.4" fill="#f4e3a8" />
      </svg>
    </Layer>
    {/* Its rock. */}
    <Layer box={at(1150, 800, 170, 100)}>
      <svg viewBox="0 0 170 100" preserveAspectRatio="none" className="h-full w-full">
        <path d="M0 100 C6 60 30 26 72 16 C112 8 148 30 160 60 C166 76 170 90 170 100 Z" fill="#0b1610" />
        <path d="M30 40 C46 24 70 16 96 16" fill="none" stroke="#6e9a6e" strokeOpacity="0.3" strokeWidth="2" />
      </svg>
    </Layer>
  </>
);

function Spores({ count }: { count: number }) {
  const rnd = mulberry32(61);
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const x = rnd() * 1600;
        const y = 280 + rnd() * 560;
        const s = 3 + rnd() * 5;
        return (
          <span
            key={i}
            aria-hidden="true"
            className={`eco-spore eco-spore-${i % 3} absolute rounded-full`}
            style={{
              ...at(x, y, s, s),
              animationDuration: `${10 + rnd() * 9}s`,
              animationDelay: `${-rnd() * 18}s`,
            }}
          />
        );
      })}
    </>
  );
}

/* ── the scene ───────────────────────────────────────────── */

/*
 * Where the field-notes panel sits on desktop, floating over the scene: the
 * corner or edge that covers the fewest markers — and never the one just
 * opened. Top-left starts lower to clear the stage's "01 / 05" label.
 */
type Spot = 'bl' | 'bc' | 'br' | 'tr' | 'tc' | 'tl';
const SPOTS: Spot[] = ['bl', 'br', 'bc', 'tr', 'tl', 'tc'];
const SPOT_CLASS: Record<Spot, string> = {
  bl: 'bottom-5 left-5 items-start',
  bc: 'bottom-5 left-1/2 -translate-x-1/2 items-center',
  br: 'bottom-5 right-5 items-end',
  tr: 'top-5 right-5 items-end',
  tc: 'top-5 left-1/2 -translate-x-1/2 items-center',
  tl: 'top-12 left-5 items-start',
};
const EDGE = 20;
const UNDER_LABEL = 48;

function pickSpot(host: DOMRect, panel: { w: number; h: number }, markers: DOMRect[], active: number, current: Spot): Spot {
  const score = (spot: Spot) => {
    const h = spot[1];
    const left = h === 'l' ? host.left + EDGE : h === 'r' ? host.right - EDGE - panel.w : host.left + (host.width - panel.w) / 2;
    const top = spot[0] === 'b' ? host.bottom - EDGE - panel.h : host.top + (spot === 'tl' ? UNDER_LABEL : EDGE);
    let s = 0;
    markers.forEach((r, i) => {
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      if (cx > left - 14 && cx < left + panel.w + 14 && cy > top - 14 && cy < top + panel.h + 14) s += i === active ? 100 : 1;
    });
    return s;
  };
  // Ties keep the panel where it is, so it only moves when it has to.
  return [current, ...SPOTS.filter((c) => c !== current)].reduce((best, c) => (score(c) < score(best) ? c : best));
}

interface EcosystemProps {
  lite: boolean;
  still: boolean;
  /** Render the field notes here, outside the scene, instead of floating over it. */
  notesSlot?: HTMLElement | null;
}

export default function Ecosystem({ lite, still, notesSlot }: EcosystemProps) {
  const [found, setFound] = useState<Set<string>>(() => new Set());
  const [open, setOpen] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const flies = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const markers = useRef<(HTMLButtonElement | null)[]>([]);
  const [spot, setSpot] = useState<Spot>('bl');

  // Phones see a 16:9 world through a narrower window — start on the herd.
  useEffect(() => {
    const el = scroller.current;
    if (el && el.scrollWidth > el.clientWidth) el.scrollLeft = (el.scrollWidth - el.clientWidth) * 0.62;
  }, []);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const steerFlies = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (still) return;
      const scene = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - scene.left;
      const y = e.clientY - scene.top;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        flies.current?.style.setProperty('--fx', `${x.toFixed(1)}px`);
        flies.current?.style.setProperty('--fy', `${y.toFixed(1)}px`);
      });
    },
    [still],
  );

  const reveal = (id: string) => {
    setOpen((o) => (o === id ? null : id));
    setFound((f) => (f.has(id) ? f : new Set(f).add(id)));
  };

  const note = NOTES.find((n) => n.id === open);
  const done = found.size === NOTES.length;

  const place = useCallback(() => {
    const host = root.current?.getBoundingClientRect();
    const el = panel.current;
    if (!host || !el || notesSlot) return;
    const rects = markers.current.map((b) => b?.getBoundingClientRect() ?? new DOMRect(-1e4, -1e4));
    // offsetWidth/Height: the panel's laid-out size, ignoring its entrance transform.
    setSpot((c) => pickSpot(host, { w: el.offsetWidth, h: el.offsetHeight }, rects, NOTES.findIndex((n) => n.id === open), c));
  }, [open, notesSlot]);

  // Under the stage, bring an opened note into view, clear of the phone's bottom bar.
  useEffect(() => {
    if (notesSlot && open) panel.current?.scrollIntoView({ block: 'nearest', behavior: still ? 'auto' : 'smooth' });
  }, [notesSlot, open, still]);

  // Re-place when the panel changes, when the scene is panned, and on resize.
  useLayoutEffect(place, [place, done]);
  useEffect(() => {
    const el = scroller.current;
    const host = root.current;
    if (!el || !host) return;
    let raf = 0;
    const later = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(place);
    };
    el.addEventListener('scroll', later, { passive: true });
    const ro = new ResizeObserver(later);
    ro.observe(host);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('scroll', later);
      ro.disconnect();
    };
  }, [place]);

  const notes = (
    <div ref={panel} aria-live="polite" className="flex w-full scroll-mt-24 scroll-mb-28 flex-col [align-items:inherit]">
      {note ? (
        <div key={note.id} className="eco-card pointer-events-auto w-full rounded-xl p-4" style={{ animation: 'rise-in 420ms var(--ease-out-expo) both' }}>
          <div className="flex items-start gap-3">
            <p className="label flex-1 text-[#c9f29f]">
              Field note {String(NOTES.indexOf(note) + 1).padStart(2, '0')} · {note.title}
            </p>
            <button type="button" onClick={() => setOpen(null)} className="-m-1.5 p-1.5 text-white/70 hover:text-white" aria-label="Close field note">
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-[0.84rem] leading-relaxed text-white/90 sm:text-[0.9rem]">{note.body}</p>
        </div>
      ) : (
        <p className="eco-card pointer-events-auto inline-flex items-center gap-2.5 rounded-full px-4 py-2 font-mono text-[0.62rem] tracking-[0.18em] text-white/85 uppercase">
          <span aria-hidden="true" className="h-1.5 w-1.5 rotate-45 bg-[#c9f29f]" />
          {done ? 'Ecosystem logged · 6 / 6' : `Field notes ${found.size} / ${NOTES.length}`}
          <span className="text-white/50 max-sm:hidden">· find the markers</span>
          <span className="text-white/50 sm:hidden">· drag to look</span>
        </p>
      )}
    </div>
  );

  return (
    <div ref={root} className={cn('eco absolute inset-0 overflow-hidden', still && 'eco-still')}>
      {/* `isolate` keeps the markers' z-index inside the scene, so they can
          never paint over the field-notes panel layered above it. */}
      <div ref={scroller} className="no-scrollbar absolute inset-0 isolate overflow-x-auto overflow-y-hidden overscroll-x-contain">
        <div className="eco-scene relative h-full min-w-full overflow-hidden" style={{ aspectRatio: '16 / 9' }} onPointerMove={steerFlies} onPointerDown={steerFlies}>
          <Landscape lite={lite} />

          {/* Light through the canopy. */}
          <Layer box={at(0, 0, 1600, 900)} className="eco-rays">
            <svg viewBox="0 0 1600 900" preserveAspectRatio="none" className="h-full w-full">
              {[
                [1180, 210, 600, 900, 760, 900],
                [1180, 210, 860, 900, 960, 900],
                [1180, 210, 1080, 900, 1150, 900],
              ].map((p, i) => (
                <path key={i} d={`M${p[0]} ${p[1]} L${p[2]} ${p[3]} L${p[4]} ${p[5]} Z`} fill="#fff4d0" opacity={0.07 - i * 0.015} />
              ))}
            </svg>
          </Layer>

          <Giant />
          <Birds />

          {/* Mist drifting through the forest. */}
          <Layer box={at(0, 470, 1600, 230)} className="overflow-hidden">
            <div className="eco-fog h-full w-[200%]" />
          </Layer>

          {HERD.map((g, i) => (
            <Grazer key={i} g={g} />
          ))}

          <Wyvern />

          <Layer box={at(0, 640, 1600, 150)} className="overflow-hidden opacity-70">
            <div className="eco-fog eco-fog-low h-full w-[200%]" />
          </Layer>

          <Critter />

          {/* Foreground ferns frame the view. */}
          <Layer box={at(-120, 470, 360, 470)} className="eco-sway origin-bottom">
            <Fern />
          </Layer>
          <Layer box={at(1400, 500, 330, 440)} className="eco-sway origin-bottom" style={{ animationDelay: '-2.7s' }}>
            <Fern flip />
          </Layer>

          <Spores count={lite ? 9 : 18} />

          {/* Scoutflies: each trails the pointer at its own pace. */}
          <div ref={flies} aria-hidden="true" className="eco-flies pointer-events-none absolute inset-0" style={{ ['--fx' as string]: '22cqw', ['--fy' as string]: '80cqh' }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="eco-fly-wrap absolute top-0 left-0" style={{ transitionDuration: `${500 + i * 260}ms`, ['--ox' as string]: `${(i - 2) * 9}px`, ['--oy' as string]: `${((i * 7) % 5) * 6 - 12}px` }}>
                <span className="eco-scoutfly block" style={{ animationDelay: `${-i * 0.6}s` }} />
              </span>
            ))}
          </div>

          {/* Field-note markers. */}
          {NOTES.map((n, i) => (
            <button
              key={n.id}
              ref={(el) => {
                markers.current[i] = el;
              }}
              type="button"
              onClick={() => reveal(n.id)}
              aria-pressed={open === n.id}
              aria-label={`Field note ${i + 1}: ${n.title}${found.has(n.id) ? ' (found)' : ''}`}
              className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 p-2.5"
              style={{ left: `${n.x / 16}%`, top: `${n.y / 9}%` }}
            >
              <span
                className={cn(
                  'relative grid h-6 w-6 place-items-center rounded-full border transition-[background-color,border-color,transform] duration-300 group-hover:scale-110',
                  found.has(n.id) ? 'border-[#c9f29f] bg-[#c9f29f]/25' : 'border-[#c9f29f]/80 bg-[#06100a]/40',
                  open === n.id && 'scale-110 bg-[#c9f29f]/45',
                )}
              >
                {!found.has(n.id) && <span aria-hidden="true" className="absolute inset-0 rounded-full border border-[#c9f29f]" style={{ animation: 'pulse-ring 2.4s ease-out infinite' }} />}
                <span aria-hidden="true" className={cn('h-1.5 w-1.5 rotate-45', found.has(n.id) ? 'bg-[#e6ffd0]' : 'bg-[#c9f29f]')} />
              </span>
            </button>
          ))}
        </div>
      </div>

      {notesSlot ? (
        createPortal(<div className="flex max-w-xl flex-col items-start">{notes}</div>, notesSlot)
      ) : (
        // Field notes: their own layer, above the scene.
        <div className={cn('pointer-events-none absolute z-10 flex w-[min(23rem,40%)] flex-col', SPOT_CLASS[spot])}>{notes}</div>
      )}
    </div>
  );
}
