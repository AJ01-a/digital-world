import { mulberry32 } from './utils';

/** A wide canopy crown: overlapping lobes along an arc. */
export const canopy = (seed: number, cx: number, cy: number, rx: number, ry: number, lobes: number) => {
  const rnd = mulberry32(seed);
  let d = '';
  for (let i = 0; i < lobes; i++) {
    const t = i / (lobes - 1);
    const x = cx - rx + t * rx * 2;
    const y = cy - Math.sin(t * Math.PI) * ry + rnd() * ry * 0.25;
    const r = ry * (0.32 + rnd() * 0.22) * (0.7 + Math.sin(t * Math.PI) * 0.5);
    d += `M${(x - r).toFixed(0)} ${y.toFixed(0)} a${r.toFixed(0)} ${(r * 0.8).toFixed(0)} 0 1 0 ${(r * 2).toFixed(0)} 0 a${r.toFixed(0)} ${(r * 0.8).toFixed(0)} 0 1 0 ${(-r * 2).toFixed(0)} 0 Z `;
  }
  return d;
};
