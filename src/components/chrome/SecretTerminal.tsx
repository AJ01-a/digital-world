import { useCallback, useEffect, useRef, useState } from 'react';
import { TERMINAL_HELP } from '../../data/content';
import { SCENE_MAP, type SceneId } from '../../data/worlds';
import { useActions, useTerminalOpen } from '../../state/hooks';

interface Line { kind: 'in' | 'out' | 'accent'; text: string }

const BANNER: Line[] = [
  { kind: 'accent', text: 'aj.terminal — you found it.' },
  { kind: 'out', text: "a toy with canned replies — nothing here runs on a real machine. type 'help'." },
];

const RESPONSES: Record<string, string[]> = {
  whoami: ['AJ', '', 'Curious human.', 'Technology enthusiast.', 'Gamer.', 'Builder.', 'Still learning.'],
  about: [
    'AJ.',
    'Interested in how things work, and in taking them apart to find out.',
    'Technology, games, chess, long drives, and a dog called Clover.',
  ],
  games: [
    'installed:',
    '  monster hunter    · a world that carries on without you',
    '  elden ring        · a horizon and no instructions',
    '  sekiro            · rhythm disguised as combat',
    '  gow ragnarök      · the quiet bits hit hardest',
    '  black myth wukong · mist, mountains, mythology',
  ],
  tech: [
    'daily driver  · windows + wsl',
    'other machine · omarchy, tiling, keyboard-first',
    'editor        · neovim',
    'assistant     · claude code, in the terminal',
    'philosophy    · break it, fix it, understand it',
  ],
  learning: [
    'linux · networking · cybersecurity · automation · programming · ai',
    '',
    'none of it is finished. that is the point.',
  ],
  sudo: ['nice try.'],
  ls: ['about  tech  automation  projects  games  strategy  driving  clover  secrets/'],
  'cd secrets/': ['permission denied. (there is nothing in there anyway)'],
  hello: ['hey.'],
  hi: ['hey.'],
};

export default function SecretTerminal() {
  const terminalOpen = useTerminalOpen();
  const { setTerminalOpen, goTo, openClover } = useActions();
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
    const previousFocus = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
      previousFocus?.focus?.();
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

      if (cmd === 'clear') return setLines(BANNER);
      if (cmd === 'exit' || cmd === 'q') return setTerminalOpen(false);
      if (cmd === 'help') {
        return push(TERMINAL_HELP.map(([c, d]) => ({ kind: 'out' as const, text: `${c.padEnd(11)} ${d}` })));
      }
      if (cmd === 'clover' || cmd === 'dog') {
        push([{ kind: 'accent', text: 'whistling for clover…' }]);
        setTerminalOpen(false);
        window.setTimeout(() => openClover(), 200);
        return;
      }
      if (cmd.startsWith('goto') || cmd.startsWith('cd ')) {
        const raw = cmd.split(/\s+/)[1];
        const target = (raw === 'dog' ? 'clover' : raw) as SceneId | undefined;
        if (target && SCENE_MAP[target]) {
          push([{ kind: 'accent', text: `travelling to ${SCENE_MAP[target].label.toLowerCase()}…` }]);
          setTerminalOpen(false);
          window.setTimeout(() => goTo(target), 220);
        } else {
          push([{ kind: 'out', text: 'unknown destination. try: home about tech automation projects games onepiece loki book strategy driving clover' }]);
        }
        return;
      }
      const found = RESPONSES[cmd];
      if (found) return push(found.map((text) => ({ kind: 'out' as const, text })));
      push([{ kind: 'out', text: `command not found: ${cmd}. try 'help'.` }]);
    },
    [goTo, setTerminalOpen, openClover],
  );

  if (!terminalOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6" style={{ animation: 'fade-in 180ms ease both' }}>
      <div className="absolute inset-0 bg-black/65" onClick={() => setTerminalOpen(false)} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Terminal"
        className="surface relative w-full max-w-[640px] overflow-hidden"
        style={{ background: 'color-mix(in oklab, var(--env-void) 94%, black)', animation: 'pop-in 320ms var(--ease-out-expo) both' }}
      >
        <div className="flex items-center gap-3 border-b border-white/8 px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden="true">
            {['#ff6b6b', '#f5c26b', '#7fd1a6'].map((c) => (
              <span key={c} className="h-2.5 w-2.5 rounded-full opacity-60" style={{ background: c }} />
            ))}
          </span>
          <span className="font-mono text-[0.68rem] tracking-[0.2em] text-[var(--color-ink-dim)] uppercase">aj@world:~</span>
          <button
            type="button"
            onClick={() => setTerminalOpen(false)}
            className="ml-auto rounded px-2 py-1 font-mono text-[0.66rem] tracking-[0.2em] text-[var(--color-ink-faint)] uppercase hover:text-[var(--color-ink)]"
            aria-label="Close terminal"
          >
            esc
          </button>
        </div>

        <div
          ref={logRef}
          role="log"
          aria-live="polite"
          className="max-h-[46vh] min-h-[220px] overflow-y-auto px-4 py-4 font-mono text-[0.74rem] leading-[1.85] sm:text-[0.8rem]"
        >
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
          <span className="font-mono text-[0.8rem] text-[var(--env-accent)]" aria-hidden="true">$</span>
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
            autoCapitalize="off"
            aria-label="Terminal input"
            placeholder="type 'help'"
            className="w-full bg-transparent font-mono text-[16px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)] sm:text-[0.8rem]"
          />
        </form>
      </div>
    </div>
  );
}
