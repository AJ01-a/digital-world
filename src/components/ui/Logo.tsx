import { useId } from 'react';
import { cn } from '../../lib/utils';

/*
 * The AJ monogram.
 *
 * A ligature rather than two letters side by side: the A's right side is a
 * vertical stem, and that same stem carries on below the baseline and hooks
 * left into the J — so the J cradles the A. The crossbar runs on through the
 * stem as a thin circuit trace and ends in a warm node, the one touch of
 * Clover-orange in the brand.
 *
 * Geometry is on a 120-unit grid and shared with public/favicon.svg.
 */
export const MARK = 'M28 80 L54 24 H68 V76 Q68 94 50 94 H40';
export const BAR = 'M37 60 H68';
export const TRACE = 'M68 60 H82 L88 54';
const FRAME = 'M30 6 H90 L114 30 V90 L90 114 H30 L6 90 V30 Z';
const FRAME_INNER = 'M33 12 H87 L108 33 V87 L87 108 H33 L12 87 V33 Z';

/*
 * Colourways. `duality` is the site's own, from the intro — white light on
 * the left of the mark, red on the right, meeting in the stem. `brand` is
 * the original icy blue, kept for reference. The orange node stays in both.
 */
const TONES = {
  brand: { stops: ['#f4f9ff', '#8fe6ff', '#5ce1ff', '#9b86ff'], x: [0.1, 0.9], dash: '#8fe6ff', ticks: '#b8d4ff', depth: '#2c2370' },
  duality: { stops: ['#ffffff', '#e9edf5', '#ff5a5f', '#e0141f'], x: [0.28, 0.72], dash: '#e9edf5', ticks: '#ffd5d7', depth: '#3a0a10' },
};

interface LogoProps {
  size?: number;
  className?: string;
  /** `full` adds the inner frame, ticks and bevel; `compact` stays legible at icon sizes. */
  detail?: 'full' | 'compact';
  /** Draw the strokes on when mounted. Runs once. */
  draw?: boolean;
  /** Pass a light sweep through the mark once. */
  sweep?: boolean;
  /** Accessible name. Omit when the mark sits next to a visible "AJ". */
  title?: string;
  /** Offset for the draw-on / sweep, in ms. */
  delay?: number;
  tone?: keyof typeof TONES;
}

export default function Logo({ size = 44, className, detail = 'full', draw = false, sweep = false, title, delay = 0, tone = 'duality' }: LogoProps) {
  const uid = useId().replace(/:/g, '');
  const g = `aj-g-${uid}`;
  const s = `aj-s-${uid}`;
  const m = `aj-m-${uid}`;
  const full = detail === 'full';
  const sw = full ? 9 : 10;
  const t = TONES[tone];

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={cn('shrink-0 overflow-visible', draw && 'aj-draw', sweep && 'aj-sweep-run', className)}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={{ ['--base' as string]: `${delay}ms` }}
    >
      <defs>
        <linearGradient id={g} x1={t.x[0]} y1="0" x2={t.x[1]} y2={tone === 'brand' ? 1 : 0}>
          <stop offset="0" stopColor={t.stops[0]} />
          <stop offset="0.4" stopColor={t.stops[1]} />
          <stop offset="0.62" stopColor={t.stops[2]} />
          <stop offset="1" stopColor={t.stops[3]} />
        </linearGradient>
        <linearGradient id={s} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={m} maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120">
          <g fill="none" stroke="#fff" strokeLinejoin="miter">
            <path d={MARK} strokeWidth={sw} />
            <path d={BAR} strokeWidth={sw - 2} />
          </g>
        </mask>
      </defs>

      {/* Frame: a chamfered octagon with precision ticks. */}
      <g className="aj-frame" fill="none">
        <path d={FRAME} stroke={`url(#${g})`} strokeOpacity={full ? 0.5 : 0.7} strokeWidth={full ? 1.4 : 3} />
        {full && (
          <>
            <path d={FRAME_INNER} stroke={t.dash} strokeOpacity="0.18" strokeWidth="0.8" strokeDasharray="2 4" />
            <g stroke={t.ticks} strokeOpacity="0.7" strokeWidth="1.4">
              <path d="M60 0 V6 M60 114 V120 M0 60 H6 M114 60 H120" />
            </g>
            <rect x="99.5" y="15.5" width="4" height="4" fill="#ff9b52" transform="rotate(45 101.5 17.5)" opacity="0.9" />
          </>
        )}
      </g>

      {/* Extrusion: the same strokes, offset and in a deep shade of the tone, for depth. */}
      <g fill="none" stroke={t.depth} strokeLinejoin="miter" transform="translate(2.6 2.6)" opacity="0.95">
        <path d={MARK} strokeWidth={sw} />
        <path d={BAR} strokeWidth={sw - 2} />
      </g>

      {/* The mark. */}
      <g fill="none" stroke={`url(#${g})`} strokeLinejoin="miter">
        <path className="aj-stroke" pathLength={1} d={MARK} strokeWidth={sw} />
        <path className="aj-stroke" pathLength={1} d={BAR} strokeWidth={sw - 2} style={{ ['--dd' as string]: '320ms' }} />
        <path className="aj-stroke" pathLength={1} d={TRACE} strokeWidth={full ? 2.2 : 3} strokeLinecap="round" style={{ ['--dd' as string]: '520ms' }} />
      </g>
      <g className="aj-node">
        {full && <circle cx="91" cy="51" r="6.5" fill="none" stroke="#ff9b52" strokeOpacity="0.4" strokeWidth="1" />}
        <circle cx="91" cy="51" r={full ? 3.4 : 4.4} fill="#ff9b52" />
      </g>

      {/* Bevel highlight, kept inside the strokes by the mask. */}
      {full && (
        <g mask={`url(#${m})`}>
          <g fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.3" transform="translate(-2.4 -2.2)">
            <path d={MARK} />
            <path d="M46 60 H68" />
          </g>
        </g>
      )}

      {sweep && (
        <g mask={`url(#${m})`}>
          <g transform="skewX(-18)">
            <rect className="aj-sweep" x="0" y="0" width="34" height="140" fill={`url(#${s})`} />
          </g>
        </g>
      )}
    </svg>
  );
}
