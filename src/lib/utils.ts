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
  window.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
}
