/**
 * Just enough chess for the puzzles on this page: FEN parsing and
 * pseudo-legal move generation so selected pieces can show where they can go.
 * Deliberately not a full engine — the puzzles are one-move positions.
 */

export type Board = (string | null)[]; // 64 squares, index 0 = a8

export const FILES = 'abcdefgh';

export const idxToSquare = (i: number) => `${FILES[i % 8]}${8 - Math.floor(i / 8)}`;

export const isWhite = (piece: string) => piece === piece.toUpperCase();

export function parseFen(fen: string): Board {
  const board: Board = Array(64).fill(null);
  const rows = fen.split(' ')[0].split('/');
  rows.forEach((row, r) => {
    let f = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) f += Number(ch);
      else board[r * 8 + f++] = ch;
    }
  });
  return board;
}

const RAYS: Record<string, number[][]> = {
  r: [[1, 0], [-1, 0], [0, 1], [0, -1]],
  b: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
  q: [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]],
};

const KNIGHT = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];

/** Squares a piece could move to, ignoring checks. */
export function moves(board: Board, from: number): number[] {
  const piece = board[from];
  if (!piece) return [];
  const white = isWhite(piece);
  const type = piece.toLowerCase();
  const file = from % 8;
  const rank = Math.floor(from / 8);
  const out: number[] = [];

  const occupiedBy = (i: number) => {
    const p = board[i];
    return p ? (isWhite(p) ? 'w' : 'b') : null;
  };
  const me = white ? 'w' : 'b';

  const slide = (dirs: number[][]) => {
    for (const [df, dr] of dirs) {
      let f = file + df;
      let r = rank + dr;
      while (f >= 0 && f < 8 && r >= 0 && r < 8) {
        const i = r * 8 + f;
        const owner = occupiedBy(i);
        if (owner === me) break;
        out.push(i);
        if (owner) break;
        f += df;
        r += dr;
      }
    }
  };

  if (type === 'r' || type === 'b' || type === 'q') slide(RAYS[type]);

  if (type === 'n') {
    for (const [df, dr] of KNIGHT) {
      const f = file + df;
      const r = rank + dr;
      if (f < 0 || f > 7 || r < 0 || r > 7) continue;
      const i = r * 8 + f;
      if (occupiedBy(i) !== me) out.push(i);
    }
  }

  if (type === 'k') {
    for (let df = -1; df <= 1; df++) {
      for (let dr = -1; dr <= 1; dr++) {
        if (!df && !dr) continue;
        const f = file + df;
        const r = rank + dr;
        if (f < 0 || f > 7 || r < 0 || r > 7) continue;
        const i = r * 8 + f;
        if (occupiedBy(i) !== me) out.push(i);
      }
    }
  }

  if (type === 'p') {
    const dir = white ? -1 : 1;
    const one = (rank + dir) * 8 + file;
    if (rank + dir >= 0 && rank + dir < 8 && !board[one]) {
      out.push(one);
      const startRank = white ? 6 : 1;
      const two = (rank + dir * 2) * 8 + file;
      if (rank === startRank && !board[two]) out.push(two);
    }
    for (const df of [-1, 1]) {
      const f = file + df;
      const r = rank + dir;
      if (f < 0 || f > 7 || r < 0 || r > 7) continue;
      const i = r * 8 + f;
      if (occupiedBy(i) && occupiedBy(i) !== me) out.push(i);
    }
  }

  return out;
}

export const GLYPHS: Record<string, string> = {
  K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};

export interface Puzzle {
  fen: string;
  from: string;
  to: string;
  prompt: string;
  hint: string;
  success: string;
}

export const PUZZLES: Puzzle[] = [
  {
    fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1',
    from: 'a1',
    to: 'a8',
    prompt: 'White to play. Mate in one.',
    hint: 'The black king has no air. Look at the back rank.',
    success: 'Back-rank mate. Nowhere to run.',
  },
  {
    fen: '3q3k/5ppp/8/4N3/8/8/5PPP/6K1 w - - 0 1',
    from: 'e5',
    to: 'f7',
    prompt: 'White to play. Win the queen.',
    hint: 'One piece can attack two things at once.',
    success: 'Fork. Check first, queen second.',
  },
  {
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w - - 0 1',
    from: 'h5',
    to: 'f7',
    prompt: 'White to play. Finish it.',
    hint: 'The weakest square in the position is defended by one piece only.',
    success: 'The bishop was covering f7 the whole time.',
  },
];
