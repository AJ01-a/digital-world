import { useCallback, useEffect, useMemo, useState } from 'react';
import { useInView } from '../hooks/useInView';
import Button from '../components/ui/Button';
import Panel from '../components/ui/Panel';
import Reveal, { RevealWords } from '../components/ui/Reveal';
import SectionShell from '../components/ui/SectionShell';
import { useActions, useTerminalOpen } from '../state/hooks';
import { cn, pick } from '../lib/utils';

/** Words that mean something to me — the puzzle picks one at random. */
const WORDS = ['LINUX', 'CHESS', 'DEBUG', 'SHELL', 'DRIVE', 'QUEST', 'PIXEL', 'EMBER', 'LOGIC', 'CACHE', 'ROUTE', 'TOKEN'];
const ROWS = 6;
const LEN = 5;
type Mark = 'exact' | 'near' | 'miss';

const KEYS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

/** Standard two-pass scoring so repeated letters behave correctly. */
function score(guess: string, answer: string): Mark[] {
  const marks: Mark[] = Array(LEN).fill('miss');
  const pool = answer.split('');
  for (let i = 0; i < LEN; i++) {
    if (guess[i] === pool[i]) {
      marks[i] = 'exact';
      pool[i] = '';
    }
  }
  for (let i = 0; i < LEN; i++) {
    if (marks[i] === 'exact') continue;
    const at = pool.indexOf(guess[i]);
    if (at > -1) {
      marks[i] = 'near';
      pool[at] = '';
    }
  }
  return marks;
}

export default function Words() {
  const terminalOpen = useTerminalOpen();
  const { celebrate } = useActions();
  // Typing should work as soon as the board is on screen — waiting for this
  // to become the "active" chapter made the puzzle feel broken.
  const [boardRef, onScreen] = useInView<HTMLDivElement>('-8% 0px');
  const [answer, setAnswer] = useState(() => pick(WORDS));
  const [guesses, setGuesses] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [shake, setShake] = useState(0);
  const [note, setNote] = useState<string | null>(null);

  const done = guesses.includes(answer) || guesses.length >= ROWS;
  const won = guesses.includes(answer);

  const marks = useMemo(() => guesses.map((g) => score(g, answer)), [guesses, answer]);

  const keyState = useMemo(() => {
    const state: Record<string, Mark> = {};
    const rank: Record<Mark, number> = { miss: 0, near: 1, exact: 2 };
    guesses.forEach((g, r) => {
      g.split('').forEach((ch, i) => {
        const m = marks[r][i];
        if (!state[ch] || rank[m] > rank[state[ch]]) state[ch] = m;
      });
    });
    return state;
  }, [guesses, marks]);

  const submit = useCallback(() => {
    if (draft.length < LEN) {
      setShake((s) => s + 1);
      setNote('Five letters.');
      return;
    }
    setGuesses((g) => [...g, draft]);
    setDraft('');
    setNote(null);
    if (draft === answer) celebrate('Nice. You might fit in here.');
  }, [draft, answer, celebrate]);

  const type = useCallback(
    (ch: string) => {
      if (done) return;
      setNote(null);
      setDraft((d) => (d.length < LEN ? d + ch : d));
    },
    [done],
  );

  const back = useCallback(() => setDraft((d) => d.slice(0, -1)), []);

  const reset = useCallback(() => {
    setAnswer((prev) => {
      let next = prev;
      while (next === prev) next = pick(WORDS);
      return next;
    });
    setGuesses([]);
    setDraft('');
    setNote(null);
  }, []);

  /* Physical keyboard, but only while the board is actually on screen. */
  useEffect(() => {
    if (!onScreen || terminalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
      if (e.key === 'Enter') {
        if (done) return;
        e.preventDefault();
        submit();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        back();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        type(e.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onScreen, terminalOpen, submit, back, type, done]);

  const rows = Array.from({ length: ROWS }, (_, r) => {
    if (r < guesses.length) return { letters: guesses[r], marks: marks[r], settled: true };
    if (r === guesses.length) return { letters: draft.padEnd(LEN), marks: null, settled: false };
    return { letters: ' '.repeat(LEN), marks: null, settled: false };
  });

  return (
    <SectionShell id="words" labelledBy="words-title">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16 [&>*]:min-w-0">
        <div className="lg:col-span-5">
          <h2 id="words-title" className="h-section">
            <RevealWords text="Can you guess the word?" />
          </h2>
          <Reveal delay={0.12} as="p" className="prose-lede mt-7">
            I enjoy a good word puzzle. Here's one built from scratch for this page —
            five letters, six tries, and a small list of words that mean something to me.
          </Reveal>
          <Reveal delay={0.2} className="mt-8">
            <ul className="space-y-2.5 font-mono text-[0.7rem] tracking-[0.12em] text-[var(--color-ink-dim)] uppercase">
              <li className="flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-[4px] bg-[var(--env-accent)] font-semibold text-[#06110c]">A</span>
                right letter, right place
              </li>
              <li className="flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-[4px] border border-[var(--env-accent)] text-[var(--env-accent)]">B</span>
                in the word, wrong place
              </li>
              <li className="flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-[4px] border border-white/10 text-[var(--color-ink-faint)]">C</span>
                not in the word
              </li>
            </ul>
          </Reveal>
        </div>

        <div className="lg:col-span-7">
          <Reveal delay={0.15}>
            <Panel brackets className="mx-auto max-w-[520px] p-4 sm:p-6">
              <div ref={boardRef}>
              <div
                key={shake}
                style={shake ? { animation: 'shake 350ms ease both' } : undefined}
                className="mx-auto grid w-full max-w-[330px] gap-2"
              >
                {rows.map((row, r) => (
                  <div key={r} className="grid grid-cols-5 gap-2">
                    {Array.from({ length: LEN }, (_, c) => {
                      const ch = row.letters[c] ?? ' ';
                      const mark = row.marks?.[c];
                      const filled = ch.trim().length > 0;
                      return (
                        <div
                          key={c}
                          className={cn(
                            'grid aspect-square place-items-center rounded-md text-[clamp(1.1rem,3.2vw,1.6rem)] font-medium',
                            !mark && 'border',
                            !mark && (filled ? 'border-[color-mix(in_oklab,var(--env-accent)_45%,transparent)]' : 'border-white/8'),
                            mark === 'exact' && 'bg-[var(--env-accent)] text-[#06110c]',
                            mark === 'near' && 'border-2 border-[var(--env-accent)] text-[var(--env-accent)]',
                            mark === 'miss' && 'border border-white/8 bg-white/[0.03] text-[var(--color-ink-faint)]',
                          )}
                          style={row.settled ? { animation: `flip-in 450ms var(--ease-out-expo) ${c * 90}ms both` } : undefined}
                          aria-label={mark ? `${ch}: ${mark === 'exact' ? 'correct' : mark === 'near' ? 'present' : 'absent'}` : ch.trim() || 'empty'}
                        >
                          {ch.trim()}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="mt-6 min-h-[2.25rem] text-center">
                {done ? (
                    <div className="flex flex-col items-center gap-3" style={{ animation: 'rise-in 400ms var(--ease-out-expo) both' }} role="status">
                      <p className="text-[1.05rem] text-[var(--color-ink)]">
                        {won ? 'Nice. You might fit in here.' : `It was ${answer}. Close enough.`}
                      </p>
                      <Button onClick={reset}>Play another</Button>
                    </div>
                  ) : (
                    <p
                      key={note ?? 'idle'}
                      style={{ animation: 'fade-in 250ms ease both' }}
                      className="font-mono text-[0.65rem] tracking-[0.22em] text-[var(--env-tint)] uppercase"
                    >
                      {note ?? `Attempt ${guesses.length + 1} of ${ROWS}`}
                    </p>
                  )}
              </div>

              {/* On-screen keys, so this works on a phone too. */}
              <div className="mt-5 flex flex-col items-center gap-1.5" aria-label="Letter keyboard">
                {KEYS.map((row, i) => (
                  <div key={row} className="flex w-full justify-center gap-1 sm:gap-1.5">
                    {i === 2 && (
                      <button
                        type="button"
                        onClick={submit}
                        disabled={done}
                        className="shrink-0 rounded-md border border-[color-mix(in_oklab,var(--env-accent)_28%,transparent)] px-2 py-3 font-mono sm:px-3 text-[0.66rem] tracking-[0.1em] text-[var(--color-ink-dim)] uppercase transition-colors hover:bg-white/5 disabled:opacity-35"
                      >
                        Enter
                      </button>
                    )}
                    {row.split('').map((k) => {
                      const st = keyState[k];
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => type(k)}
                          disabled={done}
                          aria-label={`Letter ${k}`}
                          className={cn(
                            'min-w-0 flex-1 rounded-md py-3 text-[0.85rem] font-medium transition-colors duration-200 disabled:opacity-35 sm:min-w-[36px]',
                            !st && 'bg-white/[0.05] text-[var(--color-ink-dim)] hover:bg-white/10',
                            st === 'exact' && 'bg-[var(--env-accent)] text-[#06110c]',
                            st === 'near' && 'border border-[var(--env-accent)] text-[var(--env-accent)]',
                            st === 'miss' && 'bg-white/[0.02] text-[var(--color-ink-faint)]',
                          )}
                        >
                          {k}
                        </button>
                      );
                    })}
                    {i === 2 && (
                      <button
                        type="button"
                        onClick={back}
                        disabled={done}
                        aria-label="Delete letter"
                        className="shrink-0 rounded-md border border-[color-mix(in_oklab,var(--env-accent)_28%,transparent)] px-2 py-3 font-mono sm:px-3 text-[0.66rem] tracking-[0.1em] text-[var(--color-ink-dim)] uppercase transition-colors hover:bg-white/5 disabled:opacity-35"
                      >
                        Del
                      </button>
                    )}
                  </div>
                ))}
              </div>
              </div>
            </Panel>
          </Reveal>
        </div>
      </div>
    </SectionShell>
  );
}
