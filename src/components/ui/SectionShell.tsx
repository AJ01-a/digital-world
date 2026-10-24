import { useCallback, useRef, type ReactNode } from 'react';
import { SCENE_MAP, type SceneId, type Theme } from '../../data/worlds';
import { themeVars } from '../../lib/theme';
import { observe, useReveal } from '../../hooks/useInView';
import { useActions } from '../../state/hooks';
import { cn } from '../../lib/utils';

interface Props {
  id: SceneId;
  children: ReactNode;
  className?: string;
  /** Shows the numbered chapter header. */
  header?: boolean;
  /** Vertical rhythm preset. */
  size?: 'full' | 'auto';
  /** Centred chapters keep the rail clearance on both sides. */
  align?: 'start' | 'center';
  labelledBy?: string;
  /** Override the chapter palette (the game worlds re-tint their section). */
  theme?: Theme;
}

export default function SectionShell({ id, children, className, header = true, size = 'full', align = 'start', labelledBy, theme }: Props) {
  const { register } = useActions();
  const scene = SCENE_MAP[id];
  const stopWatching = useRef<(() => void) | null>(null);
  const headerRef = useReveal<HTMLDivElement>();

  const ref = useCallback(
    (el: HTMLElement | null) => {
      register(id, el);
      stopWatching.current?.();
      stopWatching.current = null;
      if (!el) return;
      // Decorative CSS animation inside a chapter pauses while it is off
      // screen, so the page only ever animates what you can see.
      el.classList.add('is-offscreen');
      stopWatching.current = observe(el, (e) => el.classList.toggle('is-offscreen', !e.isIntersecting), '120px 0px');
    },
    [id, register],
  );

  return (
    <section
      ref={ref}
      id={id}
      data-scene={id}
      aria-labelledby={labelledBy}
      // Each chapter carries its own palette, statically — scrolling never
      // restyles page content.
      style={themeVars(theme ?? scene.theme)}
      className={cn(
        'relative w-full scroll-mt-[4.5rem] px-[var(--shell)]',
        // The navigation rail is fixed to the right edge from 861px up, so
        // the content reserves a lane for it instead of sliding underneath.
        align === 'center' ? 'min-[861px]:px-[calc(var(--shell)+6rem)]' : 'min-[861px]:pr-[calc(var(--shell)+6rem)]',
        size === 'full'
          ? 'flex min-h-[100svh] flex-col justify-center py-24 md:py-28 [@media(max-height:560px)]:py-14'
          : 'py-24 md:py-32 [@media(max-height:560px)]:py-14',
        className,
      )}
    >
      {header && (
        <div ref={headerRef} className="mx-auto mb-10 flex w-full max-w-[1180px] items-center gap-4 md:mb-14">
          <span className="font-mono text-[0.7rem] tracking-[0.24em] text-[var(--env-accent)]">
            <span aria-hidden="true" className="mr-2 inline-block h-1.5 w-1.5 rotate-45 bg-[var(--env-accent)] align-middle" />
            {scene.index}
          </span>
          <span className="eyebrow">{scene.label}</span>
          <span aria-hidden="true" className="hairline draw-x h-px flex-1" />
          <span className="eyebrow hidden opacity-70 sm:inline">{scene.mood}</span>
        </div>
      )}
      <div className="mx-auto w-full max-w-[1180px]">{children}</div>
    </section>
  );
}
