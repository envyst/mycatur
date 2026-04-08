import { getSpecializedPieceAt } from './specialized.js';

export const PIECE_TYPES = {
  KING: 'king',
  QUEEN: 'queen',
  ROOK: 'rook',
  BISHOP: 'bishop',
  KNIGHT: 'knight',
  PAWN: 'pawn',
};

export const PIECE_SYMBOLS = {
  white: {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙',
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟',
  },
};

export function getPieceLabel(piece, row = null, col = null, specializedAssignments = null) {
  if (!piece) return '';
  if (specializedAssignments && row !== null && col !== null) {
    const specialized = getSpecializedPieceAt(specializedAssignments, row, col);
    if (specialized) {
      return `${piece.color} ${specialized.specialization}`;
    }
  }
  return `${piece.color} ${piece.type}`;
}

export function getPieceSymbol(piece) {
  if (!piece) return '';
  return PIECE_SYMBOLS[piece.color][piece.type];
}
