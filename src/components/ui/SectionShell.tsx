import { motion } from 'motion/react';
import { useCallback, type ReactNode } from 'react';
import { SCENE_MAP, type SceneId } from '../../data/worlds';
import { useActions } from '../../state/experience';
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
}

export default function SectionShell({ id, children, className, header = true, size = 'full', align = 'start', labelledBy }: Props) {
  const { register } = useActions();
  const scene = SCENE_MAP[id];

  const ref = useCallback(
    (el: HTMLElement | null) => {
      register(id, el);
    },
    [id, register],
  );

  return (
    <section
      ref={ref}
      id={id}
      data-scene={id}
      aria-labelledby={labelledBy}
      className={cn(
        'relative w-full scroll-mt-[4.5rem] px-[var(--shell)]',
        // The navigation rail is fixed to the right edge from 861px up, so
        // the content reserves a lane for it instead of sliding underneath.
        align === 'center'
          ? 'min-[861px]:px-[calc(var(--shell)+7rem)]'
          : 'min-[861px]:pr-[calc(var(--shell)+7rem)]',
        size === 'full'
          ? 'flex min-h-[100svh] flex-col justify-center py-24 md:py-28 [@media(max-height:560px)]:py-14'
          : 'py-24 md:py-32 [@media(max-height:560px)]:py-14',
        className,
      )}
    >
      {header && (
        <motion.div
          className="mx-auto mb-10 flex w-full max-w-[1180px] items-center gap-4 md:mb-14"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="font-mono text-[0.68rem] tracking-[0.3em] text-[var(--env-accent)]">{scene.index}</span>
          <span className="eyebrow">{scene.label}</span>
          <span className="hairline h-px flex-1" />
          <span className="eyebrow hidden opacity-70 sm:inline">{scene.mood}</span>
        </motion.div>
      )}
      <div className="mx-auto w-full max-w-[1180px]">{children}</div>
    </section>
  );
}
