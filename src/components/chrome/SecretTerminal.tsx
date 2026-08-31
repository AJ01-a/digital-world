import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TERMINAL_HELP } from '../../data/content';
import { SCENE_MAP, type SceneId } from '../../data/worlds';
import { useExperience } from '../../state/experience';

interface Line { kind: 'in' | 'out' | 'accent'; text: string }

const BANNER: Line[] = [
  { kind: 'accent', text: 'aj.terminal — you found it.' },
  { kind: 'out', text: "type 'help' to see what this thing does." },
];

const RESPONSES: Record<string, string[]> = {
  whoami: ['AJ', '', 'Curious human.', 'Technology enthusiast.', 'Gamer.', 'Builder.', 'Still learning.'],
  about: [
    'AJ Almachar.',
    'Interested in how things work, and in taking them apart to find out.',
    'Technology, games, chess, long drives, and a dog who does not care about any of it.',
  ],
  games: [
    'installed:',
    '  elden ring        · a horizon and no instructions',
    '  sekiro            · rhythm disguised as combat',
    '  god of war        · the quiet bits hit hardest',
    '  black myth wukong · mist, mountains, mythology',
  ],
  tech: [
    'daily driver  · windows + wsl',
    'other machine · omarchy, tiling, keyboard-first',
    'editor        · neovim',
    'assistant     · claude code, in the terminal',
    'philosophy    · break it, fix it, understand it',
  ],
  skills: [
    'learning      ████████░░  linux',
    'learning      ██████░░░░  networking',
    'learning      █████░░░░░  automation',
    'learning      ████░░░░░░  programming',
    'learning      ███░░░░░░░  cybersecurity',
    '',
    'none of these bars are finished. that is the point.',
  ],
  dog: ['status: good dog', 'walks/day: as many as possible', 'opinion on computers: none'],
  sudo: ['nice try.'],
  ls: ['about  games  strategy  tech  automation  driving  dog  secrets/'],
  'cd secrets/': ['permission denied. (there is nothing in there anyway)'],
  hello: ['hey.'],
  hi: ['hey.'],
};

export default function SecretTerminal() {
  const { terminalOpen, setTerminalOpen, goTo } = useExperience();
  const [lines, setLines] = useState<Line[]>(BANNER);
  const [value, setValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  /* "/" opens it from anywhere. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el && (['INPUT', 'TEXTAREA'].includes(el.tagName) || el.isContentEditable);
      if (e.key === '/' && !typing && !terminalOpen) {
        e.preventDefault();
        setTerminalOpen(true);
      }
      if (e.key === 'Escape' && terminalOpen) setTerminalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [terminalOpen, setTerminalOpen]);

  useEffect(() => {
    if (!terminalOpen) return;
    const focus = window.setTimeout(() => inputRef.current?.focus(), 120);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(focus);
      document.body.style.overflow = previous;
    };
  }, [terminalOpen]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [lines, terminalOpen]);

  const run = useCallback(
    (raw: string) => {
      const cmd = raw.trim().toLowerCase();
      const push = (out: Line[]) => setLines((l) => [...l, { kind: 'in', text: raw }, ...out]);
      if (!cmd) return;

      setHistory((h) => [raw, ...h].slice(0, 30));
      setHistIdx(-1);

      if (cmd === 'clear') {
        setLines(BANNER);
        return;
      }
      if (cmd === 'exit' || cmd === 'q') {
        setTerminalOpen(false);
        return;
      }
      if (cmd === 'help') {
        push(TERMINAL_HELP.map(([c, d]) => ({ kind: 'out' as const, text: `${c.padEnd(11)} ${d}` })));
        return;
      }
      if (cmd.startsWith('goto')) {
        const target = cmd.split(/\s+/)[1] as SceneId | undefined;
        if (target && SCENE_MAP[target]) {
          push([{ kind: 'accent', text: `travelling to ${SCENE_MAP[target].label.toLowerCase()}…` }]);
          setTerminalOpen(false);
          window.setTimeout(() => goTo(target), 220);
        } else {
          push([{ kind: 'out', text: 'unknown destination. try: home about games strategy tech automation driving dog' }]);
        }
        return;
      }
      const found = RESPONSES[cmd];
      if (found) {
        push(found.map((text) => ({ kind: 'out' as const, text })));
        return;
      }
      push([{ kind: 'out', text: `command not found: ${cmd}. try 'help'.` }]);
    },
    [goTo, setTerminalOpen],
  );

  return (
    <AnimatePresence>
      {terminalOpen && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setTerminalOpen(false)}
        >
          <div className="absolute inset-0 bg-black/55 backdrop-blur-[3px]" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Terminal"
            className="glass relative w-full max-w-[640px] overflow-hidden rounded-2xl"
            initial={{ y: 26, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 18, opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-white/8 px-4 py-2.5">
              <span className="flex gap-1.5">
                {['#ff6b6b', '#f5c26b', '#7fd1a6'].map((c) => (
                  <span key={c} className="h-2.5 w-2.5 rounded-full opacity-60" style={{ background: c }} />
                ))}
              </span>
              <span className="font-mono text-[0.68rem] tracking-[0.2em] text-[var(--color-ink-dim)] uppercase">
                aj@world:~
              </span>
              <button
                type="button"
                onClick={() => setTerminalOpen(false)}
                className="ml-auto font-mono text-[0.66rem] tracking-[0.2em] text-[var(--color-ink-faint)] uppercase hover:text-[var(--color-ink)]"
              >
                esc
              </button>
            </div>

            <div ref={logRef} className="max-h-[46vh] min-h-[220px] overflow-y-auto px-4 py-4 font-mono text-[0.74rem] leading-[1.85] sm:text-[0.8rem]">
              {lines.map((l, i) => (
                <p
                  key={i}
                  className={
                    l.kind === 'in'
                      ? 'text-[var(--color-ink)]'
                      : l.kind === 'accent'
                        ? 'text-[var(--env-accent)]'
                        : 'whitespace-pre-wrap text-[var(--color-ink-dim)]'
                  }
                >
                  {l.kind === 'in' && <span className="mr-2 text-[var(--env-accent)]">$</span>}
                  {l.text}
                </p>
              ))}
            </div>

            <form
              className="flex items-center gap-2 border-t border-white/8 px-4 py-3"
              onSubmit={(e) => {
                e.preventDefault();
                run(value);
                setValue('');
              }}
            >
              <span className="font-mono text-[0.8rem] text-[var(--env-accent)]">$</span>
              <input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const next = Math.min(histIdx + 1, history.length - 1);
                    if (next >= 0) {
                      setHistIdx(next);
                      setValue(history[next]);
                    }
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    const next = histIdx - 1;
                    setHistIdx(next);
                    setValue(next >= 0 ? history[next] : '');
                  }
                }}
                spellCheck={false}
                autoComplete="off"
                aria-label="Terminal input"
                placeholder="type 'help'"
                className="w-full bg-transparent font-mono text-[0.8rem] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)]"
              />
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
