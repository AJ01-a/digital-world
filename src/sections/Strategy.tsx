import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useMemo, useState } from 'react';
import {
  GLYPHS,
  PUZZLES,
  idxToSquare,
  isWhite,
  moves,
  parseFen,
  type Board,
} from '../lib/chess';
import MagneticButton from '../components/ui/MagneticButton';
import Panel from '../components/ui/Panel';
import Reveal, { RevealWords } from '../components/ui/Reveal';
import SectionShell from '../components/ui/SectionShell';
import { useExperience } from '../state/experience';
import { cn } from '../lib/utils';

type Status = 'idle' | 'wrong' | 'solved';

export default function Strategy() {
  const { celebrate, compact } = useExperience();
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const puzzle = PUZZLES[puzzleIndex];
  const [board, setBoard] = useState<Board>(() => parseFen(puzzle.fen));
  const [selected, setSelected] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [showHint, setShowHint] = useState(false);
  const [lastMove, setLastMove] = useState<[number, number] | null>(null);

  const targets = useMemo(() => (selected === null ? [] : moves(board, selected)), [board, selected]);

  const load = useCallback((index: number) => {
    setPuzzleIndex(index);
    setBoard(parseFen(PUZZLES[index].fen));
    setSelected(null);
    setStatus('idle');
    setShowHint(false);
    setLastMove(null);
  }, []);

  const play = useCallback(
    (from: number, to: number) => {
      const next = [...board];
      next[to] = next[from];
      next[from] = null;
      setBoard(next);
      setLastMove([from, to]);
      setSelected(null);

      const correct = idxToSquare(from) === puzzle.from && idxToSquare(to) === puzzle.to;
      if (correct) {
        setStatus('solved');
        celebrate(puzzle.success);
      } else {
        setStatus('wrong');
        window.setTimeout(() => {
          setBoard(parseFen(puzzle.fen));
          setLastMove(null);
          setStatus('idle');
        }, 1100);
      }
    },
    [board, puzzle, celebrate],
  );

  const onSquare = (i: number) => {
    if (status === 'solved' || status === 'wrong') return;
    const piece = board[i];
    if (selected !== null && targets.includes(i)) {
      play(selected, i);
      return;
    }
    if (piece && isWhite(piece)) setSelected(i === selected ? null : i);
    else setSelected(null);
  };

  return (
    <SectionShell id="strategy" labelledBy="strategy-title">
      <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <h2 id="strategy-title" className="h-section">
            <RevealWords text="I like games that make me think." />
          </h2>
          <Reveal delay={0.12} as="p" className="prose-lede mt-7">
            Chess is the one I keep coming back to. Thinking a few moves ahead, spotting a pattern I have seen
            before, adapting when someone does something I did not plan for — and afterwards, working out why
            the move that won actually worked.
          </Reveal>
          <Reveal delay={0.2} as="p" className="prose-lede mt-5">
            I am not a strong player. I just enjoy the part where you have to sit and think.
          </Reveal>

          <Reveal delay={0.3} className="mt-9 flex flex-wrap items-center gap-3">
            <MagneticButton onClick={() => setShowHint((v) => !v)}>
              {showHint ? 'Hide hint' : 'Need a hint?'}
            </MagneticButton>
            <MagneticButton variant="quiet" onClick={() => load((puzzleIndex + 1) % PUZZLES.length)}>
              Another position →
            </MagneticButton>
          </Reveal>

          <div className="mt-5 min-h-[3rem]">
            <AnimatePresence>
              {showHint && (
                <motion.p
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="max-w-[42ch] text-sm text-[var(--color-ink-dim)] italic"
                >
                  {puzzle.hint}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="lg:col-span-7">
          <Reveal delay={0.15}>
            <Panel className="p-4 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <span className="eyebrow">
                  Position {String(puzzleIndex + 1).padStart(2, '0')} / {String(PUZZLES.length).padStart(2, '0')}
                </span>
                <span className="font-mono text-[0.68rem] tracking-[0.14em] text-[var(--color-ink-dim)]">
                  {status === 'solved' ? puzzle.success : status === 'wrong' ? 'Not that one. Resetting…' : puzzle.prompt}
                </span>
              </div>

              <div
                className="relative mx-auto grid aspect-square w-full max-w-[520px] grid-cols-8 overflow-hidden rounded-lg border border-[color-mix(in_oklab,var(--env-accent)_20%,transparent)]"
                role="grid"
                aria-label="Chess puzzle board"
              >
                {board.map((piece, i) => {
                  const file = i % 8;
                  const rank = Math.floor(i / 8);
                  const dark = (file + rank) % 2 === 1;
                  const isTarget = targets.includes(i);
                  const isSelected = selected === i;
                  const inLast = lastMove?.includes(i);
                  const playable = piece ? isWhite(piece) : false;
                  return (
                    <button
                      key={i}
                      type="button"
                      role="gridcell"
                      onClick={() => onSquare(i)}
                      aria-label={`${idxToSquare(i)}${piece ? ` ${isWhite(piece) ? 'white' : 'black'} ${piece.toLowerCase()}` : ' empty'}`}
                      tabIndex={playable || isTarget ? 0 : -1}
                      className={cn(
                        'relative flex items-center justify-center transition-colors duration-300',
                        dark ? 'bg-[color-mix(in_oklab,var(--env-void)_88%,black)]' : 'bg-[color-mix(in_oklab,var(--env-a)_55%,white_16%)]',
                        (playable || isTarget) && status === 'idle' ? 'cursor-pointer' : 'cursor-default',
                        isSelected && 'bg-[color-mix(in_oklab,var(--env-accent)_26%,transparent)]',
                        inLast && 'bg-[color-mix(in_oklab,var(--env-accent)_16%,transparent)]',
                      )}
                    >
                      {isTarget && (
                        <motion.span
                          layout
                          className={cn(
                            'pointer-events-none absolute rounded-full',
                            piece ? 'inset-[8%] border-2 border-[var(--env-accent)] opacity-60' : 'h-[18%] w-[18%] bg-[var(--env-accent)] opacity-45',
                          )}
                        />
                      )}
                      {piece && (
                        <motion.span
                          layoutId={`piece-${i}-${piece}-${puzzleIndex}`}
                          className="relative z-10 select-none"
                          style={{
                            fontSize: 'clamp(1.5rem, 4.6vw, 2.6rem)',
                            lineHeight: 1,
                            color: isWhite(piece) ? '#f6f8fc' : '#191d27',
                            textShadow: isWhite(piece)
                              ? '0 2px 12px rgba(0,0,0,0.85), 0 0 1px rgba(0,0,0,0.9)'
                              : '0 0 2px rgba(226,232,240,0.85), 0 1px 6px rgba(255,255,255,0.25)',
                          }}
                        >
                          {GLYPHS[piece]}
                        </motion.span>
                      )}
                      {file === 0 && (
                        <span className="pointer-events-none absolute top-0.5 left-1 font-mono text-[0.58rem] text-[var(--env-tint)] opacity-40">
                          {8 - rank}
                        </span>
                      )}
                      {rank === 7 && (
                        <span className="pointer-events-none absolute right-1 bottom-0.5 font-mono text-[0.58rem] text-[var(--env-tint)] opacity-40">
                          {idxToSquare(i)[0]}
                        </span>
                      )}
                    </button>
                  );
                })}

                <AnimatePresence>
                  {status === 'solved' && (
                    <motion.div
                      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 backdrop-blur-sm"
                      style={{ background: 'color-mix(in oklab, var(--env-void) 72%, transparent)' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.p
                        className="display px-6 text-center text-[clamp(1.4rem,1rem+1.6vw,2.2rem)] text-[var(--color-ink)]"
                        initial={{ y: 14, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        {puzzle.success}
                      </motion.p>
                      <MagneticButton onClick={() => load((puzzleIndex + 1) % PUZZLES.length)}>
                        Next position →
                      </MagneticButton>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <p className="mt-4 text-center font-mono text-[0.7rem] tracking-[0.2em] text-[var(--env-tint)] uppercase opacity-70">
                {compact ? 'Tap a white piece, then a square' : 'Click a white piece, then a square'}
              </p>
            </Panel>
          </Reveal>
        </div>
      </div>
    </SectionShell>
  );
}
