const SEEN = 'aj:intro-seen';

/**
 * Whether to play the full entry sequence. It is an enhancement, never a
 * gate: skipped for reduced motion, for deep links straight to a chapter,
 * and after the first play in a browser session (sessionStorage only — no
 * cookies, nothing that outlives the tab).
 */
export function shouldPlayIntro() {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (window.location.hash) return false;
  try {
    return !window.sessionStorage.getItem(SEEN);
  } catch {
    return true;
  }
}

export function markIntroSeen() {
  try {
    window.sessionStorage.setItem(SEEN, '1');
  } catch {
    /* storage blocked — the intro just plays again next time */
  }
}
