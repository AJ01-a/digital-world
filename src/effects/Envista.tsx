import { forwardRef, useId, useImperativeHandle, useRef } from 'react';
import { ENVISTA } from './envistaGeometry';

/**
 * A white 2025 Buick Envista in profile, drawn to the real proportions:
 * 182.6 in long, 61.7 in tall, 106.3 in wheelbase, 225/55R18 tyres —
 * 600 units of body, so 1 in ≈ 3.29 units. Facing right.
 *
 * It does not animate itself. The road canvas that owns the driving
 * scene's one animation loop turns the wheels, settles the suspension and
 * slides the reflection, so the wheels always match the road speed. The
 * moving parts (spokes, reflection, the whole car) are separate layers
 * moved with CSS transforms, so the drawing itself is painted once and
 * never repainted while driving.
 */

export interface EnvistaHandle {
  /** Wheel angle (radians), body offset (units), and reflection position 0–1. */
  pose(angle: number, bob: number, reflect: number): void;
  svg: SVGSVGElement | null;
}

const BODY =
  'M32 206 C25 198 22 182 22 162 C22 142 24 126 28 116 C31 108 37 102 46 98 ' +
  'C74 80 102 64 132 54 C180 40 232 35 278 36 C304 37 324 40 340 45 ' +
  'C372 62 404 82 436 100 C486 104 540 109 578 115 C596 118 610 124 618 134 ' +
  'C624 142 627 152 627 164 C627 180 624 196 618 206 L610 214 L556 214 ' +
  'A54 54 0 0 0 454 214 L208 214 A54 54 0 0 0 104 214 L44 214 Z';

/* Side glass: front door, rear door, and the quarter light that tapers to a point. */
const DLO = 'M424 104 C400 88 370 68 344 54 C320 47 290 44 262 45 C222 46 186 52 162 62 C144 70 132 80 122 92 C196 94 302 99 424 104 Z';

const Wheel = ({ u, x }: { u: string; x: number }) => (
  <g transform={`translate(${x} ${ENVISTA.axle})`}>
    <circle r="45.5" fill="#07090d" />
    <circle r="44" fill="none" stroke="#1d222b" strokeWidth="2" />
    <circle r="31.5" fill={`url(#${u}rim)`} />
    {/* Brake caliper, behind the spokes. */}
    <path d="M-15 -22 A26 26 0 0 1 4 -26.5 L3 -21 A21 21 0 0 0 -12 -17.5 Z" fill="#3a3f48" />
  </g>
);

const RIM = 31.5;

/** Five split spokes with machined faces — the part that turns. */
const Spokes = forwardRef<HTMLDivElement, { x: number }>(function Spokes({ x }, ref) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="absolute will-change-transform"
      style={{
        left: `${((x - RIM) / ENVISTA.width) * 100}%`,
        top: `${((ENVISTA.axle - RIM) / ENVISTA.height) * 100}%`,
        width: `${((RIM * 2) / ENVISTA.width) * 100}%`,
        height: `${((RIM * 2) / ENVISTA.height) * 100}%`,
      }}
    >
      <svg viewBox={`${-RIM} ${-RIM} ${RIM * 2} ${RIM * 2}`} className="block h-full w-full">
        {[0, 72, 144, 216, 288].map((a) => (
          <g key={a} transform={`rotate(${a})`}>
            <path d="M-2.6 -7 L-6.5 -29.5 L-1.4 -30 L0.6 -7.2 Z" fill="#dfe6ee" />
            <path d="M2.6 -7 L6.8 -29.3 L2.4 -29.8 L-0.2 -7.2 Z" fill="#9aa4b1" />
          </g>
        ))}
        <circle r="7.5" fill="#2a3039" />
        <circle r="3.4" fill="#b9c2cd" />
        <circle r="30" fill="none" stroke="#c8d0da" strokeOpacity="0.5" strokeWidth="1.2" />
      </svg>
    </div>
  );
});

const Envista = forwardRef<EnvistaHandle, { label: string }>(function Envista({ label }, ref) {
  const u = useId().replace(/[^a-zA-Z0-9]/g, '');
  const svg = useRef<SVGSVGElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const glint = useRef<HTMLDivElement>(null);
  const rear = useRef<HTMLDivElement>(null);
  const front = useRef<HTMLDivElement>(null);
  const lastGlint = useRef(-2);

  useImperativeHandle(
    ref,
    () => ({
      pose(angle, bob, reflect) {
        const turn = `rotate(${(((angle * 180) / Math.PI) % 360).toFixed(2)}deg)`;
        if (rear.current) rear.current.style.transform = turn;
        if (front.current) front.current.style.transform = turn;
        if (body.current) body.current.style.transform = `translate3d(0, ${((bob / ENVISTA.height) * 100).toFixed(3)}%, 0)`;
        // The reflection is 120 units wide; its centre runs from the tail (-100) to past the nose (720).
        const g = reflect < 0 ? -1 : Math.round(reflect * 400) / 400;
        if (glint.current && g !== lastGlint.current) {
          lastGlint.current = g;
          glint.current.style.transform = `translate3d(${(((g < 0 ? -400 : -100 + g * 820) - 60) / 120) * 100}%, 0, 0) skewX(-24deg)`;
        }
      },
      get svg() {
        return svg.current;
      },
    }),
    [],
  );

  return (
    <div ref={body} className="relative will-change-transform">
      <svg ref={svg} viewBox={`0 0 ${ENVISTA.width} ${ENVISTA.height}`} role="img" aria-label={label} className="block h-auto w-full overflow-visible">
        <defs>
          {/* White paint at night: cool sky light on top, falling into shadow toward the sills. */}
          <linearGradient id={`${u}paint`} x1="0" y1="36" x2="0" y2="214" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.3" stopColor="#eef3f9" />
            <stop offset="0.55" stopColor="#d6dee9" />
            <stop offset="0.78" stopColor="#a9b5c6" />
            <stop offset="1" stopColor="#6f7c90" />
          </linearGradient>
          <linearGradient id={`${u}glass`} x1="0" y1="44" x2="0" y2="104" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#3a4a62" />
            <stop offset="0.45" stopColor="#141b28" />
            <stop offset="1" stopColor="#090c13" />
          </linearGradient>
          <radialGradient id={`${u}rim`}>
            <stop offset="0.25" stopColor="#1a1f27" />
            <stop offset="1" stopColor="#0d1015" />
          </radialGradient>
          <radialGradient id={`${u}shadow`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#000" stopOpacity="0.75" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${u}swage`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="0.6" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id={`${u}sculpt`} x1="0" y1="150" x2="0" y2="204" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#4a5568" stopOpacity="0.55" />
            <stop offset="0.35" stopColor="#4a5568" stopOpacity="0.18" />
            <stop offset="1" stopColor="#1e2633" stopOpacity="0.35" />
          </linearGradient>
          <clipPath id={`${u}clip`}>
            <path d={BODY} />
          </clipPath>
          {/* The same outline in 0–1 box units, for clipping the reflection layer. */}
          <clipPath id={`${u}clipbox`} clipPathUnits="objectBoundingBox">
            <path d={BODY} transform={`scale(${1 / ENVISTA.width} ${1 / ENVISTA.height})`} />
          </clipPath>
        </defs>

        {/* Contact shadow on the tarmac. */}
        <ellipse cx="324" cy="238" rx="318" ry="11" fill={`url(#${u}shadow)`} />

        {/* Wheel wells, seen past the tyres. */}
        <circle cx="156" cy="196" r="50" fill="#05070b" />
        <circle cx="505" cy="196" r="50" fill="#05070b" />

        <Wheel u={u} x={ENVISTA.wheels[0]} />
        <Wheel u={u} x={ENVISTA.wheels[1]} />

        <g>
          <path d={BODY} fill={`url(#${u}paint)`} />

          <g clipPath={`url(#${u}clip)`}>
            {/* Sculpted lower door: the surface turns away from the light. */}
            <path d="M452 178 C380 170 290 162 214 150 C270 172 360 190 452 202 Z" fill={`url(#${u}sculpt)`} />
            {/* Black cladding: arches and sills. */}
            <path d="M44 214 L44 200 L104 200 A54 54 0 0 1 208 200 L454 200 A54 54 0 0 1 556 200 L612 200 L610 214 Z" fill="#14181f" />
            <path d="M98 214 A58 58 0 0 1 214 214 L208 214 A52 52 0 0 0 104 214 Z" fill="#14181f" />
            <path d="M448 214 A58 58 0 0 1 562 214 L556 214 A52 52 0 0 0 454 214 Z" fill="#14181f" />
            {/* Lower front intake and rear diffuser. */}
            <path d="M600 186 L627 182 L622 204 L606 208 Z" fill="#14181f" />
            <path d="M20 178 L44 182 L44 210 L30 206 Z" fill="#14181f" />
          </g>

          {/* Shoulder line and the rising lower swage. */}
          <path d="M600 132 C500 124 330 116 180 112 C120 110 70 110 34 112" fill="none" stroke={`url(#${u}swage)`} strokeWidth="1.6" />
          <path d="M600 135 C500 127 330 119 180 115 C120 113 70 113 34 115" fill="none" stroke="#7b889c" strokeOpacity="0.55" strokeWidth="1" />
          <path d="M450 176 C380 168 290 160 214 148" fill="none" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1.2" />

          {/* Greenhouse. */}
          <path d={DLO} fill={`url(#${u}glass)`} stroke="#0b0e14" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M344 56 C318 49 290 46 262 47 C230 48 196 53 170 60" fill="none" stroke="#9fb3cf" strokeOpacity="0.35" strokeWidth="1" />
          {/* B and C pillars, blacked out. */}
          <path d="M304 46 L300 100 L310 100 L314 46 Z" fill="#0b0e14" />
          <path d="M182 58 L190 96 L198 96 L192 56 Z" fill="#0b0e14" />
          {/* Windscreen and rear screen edges. */}
          <path d="M342 47 C374 64 404 83 434 100" fill="none" stroke="#2c3646" strokeWidth="3" strokeLinecap="round" />
          <path d="M130 56 C102 66 72 82 48 98" fill="none" stroke="#2c3646" strokeWidth="2.5" strokeLinecap="round" />
          {/* Roof spoiler. */}
          <path d="M34 104 C42 96 60 88 80 82 L79 87 C62 92 48 99 40 106 Z" fill="#14181f" />

          {/* Door shut lines and handles. */}
          <g fill="none" stroke="#5b677a" strokeOpacity="0.8" strokeWidth="1.1">
            <path d="M426 106 C432 140 440 172 446 200" />
            <path d="M304 101 C302 136 300 168 300 200" />
            <path d="M194 97 C198 124 204 144 214 156" />
          </g>
          <rect x="360" y="122" width="26" height="4" rx="2" fill="#8c98ab" />
          <rect x="232" y="118" width="26" height="4" rx="2" fill="#8c98ab" />

          {/* Mirror. */}
          <path d="M404 102 C400 94 404 88 414 88 C424 88 432 92 432 100 L428 104 L408 105 Z" fill={`url(#${u}paint)`} stroke="#6f7c90" strokeWidth="0.8" />
          <path d="M414 105 L424 109" stroke="#14181f" strokeWidth="3.2" strokeLinecap="round" />

          {/* Lamps: slim daytime-running blade on the nose, wraparound tail light. */}
          <path d="M584 122 C600 124 612 130 620 138 L616 141 C608 134 596 128 582 126 Z" fill="#eaf6ff" />
          <path d="M604 142 C612 143 619 147 623 152 L622 157 C616 152 610 150 603 149 Z" fill="#273141" />
          <path d="M606 144 C612 145 617 147 620 150" fill="none" stroke="#cfe6ff" strokeOpacity="0.6" strokeWidth="0.8" />
          <path d="M25 118 C32 114 46 112 60 113 L60 118 C46 118 33 120 24 125 Z" fill="#ff4a4a" />
          <path d="M25 118 C32 114 46 112 60 113" fill="none" stroke="#ffb3b3" strokeWidth="0.8" />
        </g>
      </svg>
      {/* A reflection that slides along the paint as lights go by. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ clipPath: `url(#${u}clipbox)` }}>
        <div
          ref={glint}
          className="absolute will-change-transform"
          style={{
            left: 0,
            top: `${(36 / ENVISTA.height) * 100}%`,
            width: `${(120 / ENVISTA.width) * 100}%`,
            height: `${(110 / ENVISTA.height) * 100}%`,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)',
            transform: 'translate3d(-400%, 0, 0)',
          }}
        />
      </div>
      <Spokes ref={rear} x={ENVISTA.wheels[0]} />
      <Spokes ref={front} x={ENVISTA.wheels[1]} />
    </div>
  );
});
export default Envista;
