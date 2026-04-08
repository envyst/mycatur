import { COLORS, GAME_MODES } from './config.js';
import { PIECE_TYPES } from './pieces.js';
import { createEmptyAssignments } from './specialized.js';

function createBackRank(color) {
  return [
    { color, type: PIECE_TYPES.ROOK },
    { color, type: PIECE_TYPES.KNIGHT },
    { color, type: PIECE_TYPES.BISHOP },
    { color, type: PIECE_TYPES.QUEEN },
    { color, type: PIECE_TYPES.KING },
    { color, type: PIECE_TYPES.BISHOP },
    { color, type: PIECE_TYPES.KNIGHT },
    { color, type: PIECE_TYPES.ROOK },
  ];
}

function createPawnRank(color) {
  return Array.from({ length: 8 }, () => ({ color, type: PIECE_TYPES.PAWN }));
}

export function createInitialBoard() {
  return [
    createBackRank(COLORS.BLACK),
    createPawnRank(COLORS.BLACK),
    Array(8).fill(null),
    Array(8).fill(null),
    Array(8).fill(null),
    Array(8).fill(null),
    createPawnRank(COLORS.WHITE),
    createBackRank(COLORS.WHITE),
  ];
}

export function createInitialState(options = {}) {
  return {
    mode: options.mode || GAME_MODES.HUMAN_VS_HUMAN,
    playerColor: options.playerColor || COLORS.WHITE,
    board: createInitialBoard(),
    currentTurn: COLORS.WHITE,
    selectedSquare: null,
    validMoves: [],
    moveLog: [],
    winner: null,
    started: false,
    castlingRights: {
      white: { kingSide: true, queenSide: true },
      black: { kingSide: true, queenSide: true },
    },
    enPassantTarget: null,
    pendingPromotion: null,
    halfmoveClock: 0,
    positionHistory: {},
    specializedAssignments: createEmptyAssignments(),
    isSpecialized: false,
  };
}
