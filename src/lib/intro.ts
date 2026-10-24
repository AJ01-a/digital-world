const SEEN = 'aj:intro-seen';

/**
 * Whether to play the entry sequence. It is an enhancement, never a gate:
 * skippable at once, skipped for deep links straight to a chapter, and
 * shown once per browser session (sessionStorage only — no cookies, nothing
 * that outlives the tab). With reduced motion it is the finished
 * composition, still. index.html makes the same check to preload the
 * portraits early — keep the two in step.
 */
export function shouldPlayIntro() {
  if (typeof window === 'undefined') return false;
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
