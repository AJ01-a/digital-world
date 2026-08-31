import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../hooks/useMediaQuery';

/** Types lines out one character at a time. Purely visual. */
export default function TypingLines({
  lines,
  start,
  speed = 26,
  linePause = 260,
  className,
  onDone,
}: {
  lines: string[];
  start: boolean;
  speed?: number;
  linePause?: number;
  className?: string;
  onDone?: () => void;
}) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState<string[]>([]);
  const done = useRef(false);

  useEffect(() => {
    if (!start || done.current) return;
    if (reduced) {
      setShown(lines);
      done.current = true;
      onDone?.();
      return;
    }
    let line = 0;
    let char = 0;
    let timer: number;
    const step = () => {
      if (line >= lines.length) {
        done.current = true;
        onDone?.();
        return;
      }
      char += 1;
      // Snapshot outside the updater — the loop's counters keep moving, and
      // React may replay the updater on a later render.
      const at = line;
      const text = lines[line].slice(0, char);
      setShown((prev) => {
        const next = prev.slice(0, at);
        next[at] = text;
        return next;
      });
      if (char >= lines[line].length) {
        line += 1;
        char = 0;
        timer = window.setTimeout(step, linePause);
      } else {
        timer = window.setTimeout(step, speed);
      }
    };
    timer = window.setTimeout(step, 260);
    return () => window.clearTimeout(timer);
  }, [start, lines, speed, linePause, reduced, onDone]);

  const typed = shown.length;
  const complete = typed === lines.length && shown[typed - 1] === lines[typed - 1];

  return (
    <div className={className}>
      {shown.map((l, i) => (
        <div key={i} className="whitespace-pre-wrap">
          {l}
          {i === shown.length - 1 && !complete && (
            <span className="ml-0.5 inline-block h-[1em] w-[0.5em] translate-y-[0.12em] bg-[var(--env-accent)] align-baseline" style={{ animation: 'caret 1s steps(1) infinite' }} />
          )}
        </div>
      ))}
    </div>
  );
}
