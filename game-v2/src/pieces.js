
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

export function getPieceLabel(piece) {
  if (!piece) return '';
  if (piece.specialization) {
    return `${piece.color} ${piece.specialization}`;
  }
  return `${piece.color} ${piece.type}`;
}

export function getPieceSymbol(piece) {
  if (!piece) return '';
  return PIECE_SYMBOLS[piece.color][piece.type];
}
