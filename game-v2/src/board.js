import { BOARD_SIZE, COLORS } from './config.js';
import { PIECE_TYPES } from './pieces.js';

export function isInsideBoard(row, col) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

export function cloneBoard(board) {
  return board.map(row => row.map(piece => (piece ? { ...piece } : null)));
}

export function getPiece(board, row, col) {
  if (!isInsideBoard(row, col)) return null;
  return board[row][col];
}

export function movePiece(board, fromRow, fromCol, toRow, toCol) {
  const next = cloneBoard(board);
  next[toRow][toCol] = next[fromRow][fromCol];
  next[fromRow][fromCol] = null;
  return next;
}

function collectDirectionalMoves(board, row, col, color, directions) {
  const moves = [];

  for (const [dr, dc] of directions) {
    let r = row + dr;
    let c = col + dc;

    while (isInsideBoard(r, c)) {
      const target = board[r][c];
      if (!target) {
        moves.push({ row: r, col: c });
      } else {
        if (target.color !== color) {
          moves.push({ row: r, col: c });
        }
        break;
      }
      r += dr;
      c += dc;
    }
  }

  return moves;
}

export function getValidMoves(board, row, col) {
  const piece = getPiece(board, row, col);
  if (!piece) return [];

  const { color, type } = piece;
  const moves = [];

  if (type === PIECE_TYPES.PAWN) {
    const dir = color === COLORS.WHITE ? -1 : 1;
    const startRow = color === COLORS.WHITE ? 6 : 1;

    const oneStep = row + dir;
    if (isInsideBoard(oneStep, col) && !getPiece(board, oneStep, col)) {
      moves.push({ row: oneStep, col });

      const twoStep = row + dir * 2;
      if (row === startRow && !getPiece(board, twoStep, col)) {
        moves.push({ row: twoStep, col });
      }
    }

    for (const dc of [-1, 1]) {
      const target = getPiece(board, row + dir, col + dc);
      if (target && target.color !== color) {
        moves.push({ row: row + dir, col: col + dc });
      }
    }

    return moves.filter(move => isInsideBoard(move.row, move.col));
  }

  if (type === PIECE_TYPES.KNIGHT) {
    const jumps = [
      [-2, -1], [-2, 1],
      [-1, -2], [-1, 2],
      [1, -2], [1, 2],
      [2, -1], [2, 1],
    ];

    for (const [dr, dc] of jumps) {
      const r = row + dr;
      const c = col + dc;
      if (!isInsideBoard(r, c)) continue;
      const target = getPiece(board, r, c);
      if (!target || target.color !== color) {
        moves.push({ row: r, col: c });
      }
    }

    return moves;
  }

  if (type === PIECE_TYPES.BISHOP) {
    return collectDirectionalMoves(board, row, col, color, [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
  }

  if (type === PIECE_TYPES.ROOK) {
    return collectDirectionalMoves(board, row, col, color, [[-1, 0], [1, 0], [0, -1], [0, 1]]);
  }

  if (type === PIECE_TYPES.QUEEN) {
    return collectDirectionalMoves(board, row, col, color, [
      [-1, -1], [-1, 1], [1, -1], [1, 1],
      [-1, 0], [1, 0], [0, -1], [0, 1],
    ]);
  }

  if (type === PIECE_TYPES.KING) {
    const dirs = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1],
    ];

    for (const [dr, dc] of dirs) {
      const r = row + dr;
      const c = col + dc;
      if (!isInsideBoard(r, c)) continue;
      const target = getPiece(board, r, c);
      if (!target || target.color !== color) {
        moves.push({ row: r, col: c });
      }
    }

    return moves;
  }

  return moves;
}
