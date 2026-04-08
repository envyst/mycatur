import { DEFAULT_THEME_SELECTION } from './config.js';

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

export function createThemeSelection(overrides = {}) {
  return {
    ...DEFAULT_THEME_SELECTION,
    ...overrides,
  };
}

export function getPieceLabel(piece, themes) {
  if (!piece) return '';
  if (piece.type === PIECE_TYPES.KING) {
    return piece.color === 'white' ? 'White King' : 'Black King';
  }
  return themes[piece.type] || piece.type;
}

export function getPieceSymbol(piece) {
  if (!piece) return '';
  return PIECE_SYMBOLS[piece.color][piece.type];
}
