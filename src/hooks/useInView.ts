import { useCallback, useEffect, useRef, useState } from 'react';

/*
 * One IntersectionObserver per configuration, shared by every element that
 * uses it. The old page created an observer target per *word* of every
 * heading; with hundreds of targets, every layout paid for recomputing them.
 */
type Listener = (entry: IntersectionObserverEntry) => void;
const pools = new Map<string, { io: IntersectionObserver; listeners: Map<Element, Listener> }>();

function pool(rootMargin: string, threshold: number) {
  const key = `${rootMargin}|${threshold}`;
  let p = pools.get(key);
  if (!p) {
    const listeners = new Map<Element, Listener>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) listeners.get(e.target)?.(e);
      },
      { rootMargin, threshold },
    );
    p = { io, listeners };
    pools.set(key, p);
  }
  return p;
}

export function observe(el: Element, cb: Listener, rootMargin = '0px', threshold = 0) {
  if (typeof IntersectionObserver === 'undefined') {
    // No observer support: treat everything as visible.
    cb({ isIntersecting: true, target: el } as IntersectionObserverEntry);
    return () => {};
  }
  const p = pool(rootMargin, threshold);
  p.listeners.set(el, cb);
  p.io.observe(el);
  return () => {
    p.listeners.delete(el);
    p.io.unobserve(el);
  };
}

/** Adds `is-in` to the element the first time it scrolls into view. */
export function useReveal<T extends Element>(rootMargin = '0px 0px -12% 0px') {
  const cleanup = useRef<(() => void) | null>(null);
  return useCallback(
    (el: T | null) => {
      cleanup.current?.();
      cleanup.current = null;
      if (!el) return;
      cleanup.current = observe(
        el,
        (e) => {
          if (!e.isIntersecting) return;
          el.classList.add('is-in');
          cleanup.current?.();
          cleanup.current = null;
        },
        rootMargin,
      );
    },
    [rootMargin],
  );
}

/** Live visibility, for things that should pause off screen. */
export function useInView<T extends Element>(rootMargin = '0px', once = false) {
  const [inView, setInView] = useState(false);
  const [el, setEl] = useState<T | null>(null);

  useEffect(() => {
    if (!el) return;
    let stop: (() => void) | null = null;
    stop = observe(
      el,
      (e) => {
        setInView(e.isIntersecting);
        if (once && e.isIntersecting) {
          stop?.();
          stop = null;
        }
      },
      rootMargin,
    );
    return () => stop?.();
  }, [el, rootMargin, once]);

  return [setEl, inView] as const;
}
