export const cn = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ');

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const rand = (min: number, max: number) => min + Math.random() * (max - min);

export const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
