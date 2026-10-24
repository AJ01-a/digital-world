/*
 * Geometry for the intro's duality composition — pure functions, so the
 * layout is the same on every render and can be tested without a browser.
 *
 * Both portraits are the same drawing of AJ in profile, facing left; one is
 * rim-lit white, the other red. White stays as drawn, on the left. Red is
 * mirrored, on the right, so the two sit back to back — faces to the outside,
 * the backs of their heads meeting in the middle — and the boundary between
 * the halves runs through the space behind them, never across a face.
 *
 * Wide screens: side by side, a vertical S-curve between them.
 * Tall screens: white high on the left, red low on the right, a horizontal
 * S-curve between them — the same white-left / red-right reading, stacked.
 */

/** Source portrait: width / height. */
export const PORTRAIT_RATIO = 1312 / 1199;

/** Landmarks in the unmirrored portrait, as fractions of the image. */
export const FACE = { x0: 0.25, x1: 0.53, y0: 0.29, y1: 0.67 };
/** The back of the hair, at its widest. */
const HAIR_BACK = 0.72;

/** In the joined chess lineup: where the piece bases sit, as a fraction of its height. */
const CHESS_BASE = 0.564;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Composition {
  stacked: boolean;
  white: Rect;
  /** Drawn mirrored. */
  red: Rect;
  chess: Rect;
  /** Centre and size of the monogram. */
  mark: { x: number; y: number; size: number };
  /** Centre of the wordmark. */
  word: { x: number; y: number };
  /** The orbit around the pair. */
  ring: { x: number; y: number; r: number };
  /** The boundary at a given sway (-1…1): white's side grows as sway rises. */
  boundary: (sway: number) => [number, number][];
}

const STEPS = 28;
const smooth = (a: number, b: number, t: number) => {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

export function compose(w: number, h: number): Composition {
  return w / h < 0.9 ? stackedLayout(w, h) : wideLayout(w, h);
}

function wideLayout(w: number, h: number): Composition {
  // A 16:9 stage fitted inside the screen; `u` is 1% of its height.
  const u = Math.min(h / 100, w / 177.78);
  const cx = w / 2;
  const top = (h - 100 * u) / 2;
  const ph = 96 * u;
  const pw = ph * PORTRAIT_RATIO;
  const gap = 2.6 * u;
  const white = { x: cx - gap - HAIR_BACK * pw, y: top + u, w: pw, h: ph };
  const red = { x: cx + gap - (1 - HAIR_BACK) * pw, y: top + u, w: pw, h: ph };
  const cw = 148 * u;
  const ch = cw / 4;
  const chess = { x: cx - 0.4489 * cw, y: top + 94 * u - CHESS_BASE * ch, w: cw, h: ch };

  const boundary = (sway: number) =>
    Array.from({ length: STEPS + 1 }, (_, i): [number, number] => {
      const y = (i / STEPS) * h;
      const t = (y - top) / (100 * u);
      // Nearly straight between the heads, opening into an S lower down, and
      // back to the centre by the chess lineup — where white turns red.
      const amp = (1 + 4.5 * smooth(0.38, 0.95, t)) * u;
      return [cx + sway * 3 * u + amp * Math.sin(Math.PI * 2 * (t - 0.4)), y];
    });

  return {
    stacked: false,
    white,
    red,
    chess,
    mark: { x: cx, y: top + 61 * u, size: 14 * u },
    word: { x: cx, y: Math.max(top + 4.5 * u, 30) },
    ring: { x: cx, y: top + 47 * u, r: 63 * u },
    boundary,
  };
}

function stackedLayout(w: number, h: number): Composition {
  // A 100 × 206 stage; `v` is 1% of its width. Top to bottom: white,
  // the seam, red, the chess lineup, the wordmark.
  const v = Math.min(w / 100, h / 206);
  const cx = w / 2;
  const top = (h - 206 * v) / 2;
  const pw = 116 * v;
  const ph = pw / PORTRAIT_RATIO;
  // Faces to the outside edges: white's nose near the left, red's near the right.
  const white = { x: cx - 46 * v - 0.27 * pw, y: top + 1 * v, w: pw, h: ph };
  const seam = white.y + 0.76 * ph;
  const red = { x: cx + 46 * v - 0.73 * pw, y: seam - 0.06 * ph, w: pw, h: ph };
  const cw = 116 * v;
  const ch = cw / 4;
  const base = red.y + 0.97 * ph;
  const chess = { x: cx - 0.4489 * cw, y: base - CHESS_BASE * ch, w: cw, h: ch };

  const boundary = (sway: number) =>
    Array.from({ length: STEPS + 1 }, (_, i): [number, number] => {
      const x = (i / STEPS) * w;
      const t = (x - (cx - 50 * v)) / (100 * v);
      return [x, seam + sway * 3 * v + 4 * v * Math.sin(Math.PI * 2 * (t - 0.1)) - 4 * v * (t - 0.5)];
    });

  return {
    stacked: true,
    white,
    red,
    chess,
    mark: { x: cx, y: seam, size: 21 * v },
    word: { x: cx, y: Math.min(h - 26, base + 0.2 * ch + 7 * v) },
    ring: { x: cx, y: seam, r: 82 * v },
    boundary,
  };
}

/** `clip-path: polygon()` for one side of the boundary. */
export function clipFor(c: Composition, side: 'white' | 'red', w: number, h: number, sway: number) {
  const line = c.boundary(sway);
  // Wide: white is left of the line. Stacked: white is above it.
  const corners: [number, number][] = c.stacked
    ? side === 'white'
      ? [[w + 40, -40], [-40, -40]]
      : [[w + 40, h + 40], [-40, h + 40]]
    : side === 'white'
      ? [[-40, h + 40], [-40, -40]]
      : [[w + 40, h + 40], [w + 40, -40]];
  // Stretch the line's ends past the screen so the clip never leaves a sliver.
  const ext = line.map(([x, y], i): [number, number] => {
    if (i !== 0 && i !== line.length - 1) return [x, y];
    return c.stacked ? [i === 0 ? -40 : w + 40, y] : [x, i === 0 ? -40 : h + 40];
  });
  return `polygon(${[...ext, ...corners].map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(', ')})`;
}

/** The boundary as an SVG path. */
export function pathFor(c: Composition, sway: number) {
  return c.boundary(sway).map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
}

/** A portrait's face, on screen. `mirrored` for the red side. */
export function faceRect(r: Rect, mirrored: boolean): Rect {
  const x0 = mirrored ? 1 - FACE.x1 : FACE.x0;
  return { x: r.x + x0 * r.w, y: r.y + FACE.y0 * r.h, w: (FACE.x1 - FACE.x0) * r.w, h: (FACE.y1 - FACE.y0) * r.h };
}

/*
 * `sizes` for the portraits, in CSS: the width compose() gives them —
 * min(105vh, 59.1vw) wide, min(116vw, 56.3vh) stacked. index.html preloads
 * with the same string, so the preload and the <img> pick the same file.
 */
export const PORTRAIT_SIZES = '(max-aspect-ratio: 9/10) min(116vw, 56.3vh), min(105vh, 59.1vw)';
