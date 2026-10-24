export const cn = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ');

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const rand = (min: number, max: number) => min + Math.random() * (max - min);

export const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

/** Space kept above a section when it is scrolled to (matches `scroll-mt`). */
export const SCROLL_OFFSET = 72;

/**
 * Scroll a section to the top of the viewport.
 *
 * `scrollIntoView` is not reliable here: mobile Chrome compensates for its
 * own browser controls and lands ~80px away from where it should, so the
 * position is worked out explicitly instead.
 */
export function scrollToSection(el: HTMLElement, smooth = true) {
  const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET);
  // 'instant', not 'auto': with `scroll-behavior: smooth` on <html>, 'auto'
  // would still animate.
  window.scrollTo({ top, behavior: smooth ? 'smooth' : 'instant' });
}

/** Small seeded PRNG — the same "random" artwork comes back every visit. */
export const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
