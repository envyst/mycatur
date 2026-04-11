import { COLORS, GAME_MODES } from './config.js';
import { PIECE_TYPES } from './pieces.js';
import { createEmptyAssignments } from './specialized/index.js';

function makePiece(color, type, square) {
  const prefix = color === COLORS.WHITE ? 'w' : 'b';
  return {
    id: `${prefix}-${type}-${square}`,
    color,
    type,
    specialization: null,
  };
}

function createBackRank(color, rowLabel) {
  return [
    makePiece(color, PIECE_TYPES.ROOK, `a${rowLabel}`),
    makePiece(color, PIECE_TYPES.KNIGHT, `b${rowLabel}`),
    makePiece(color, PIECE_TYPES.BISHOP, `c${rowLabel}`),
    makePiece(color, PIECE_TYPES.QUEEN, `d${rowLabel}`),
    makePiece(color, PIECE_TYPES.KING, `e${rowLabel}`),
    makePiece(color, PIECE_TYPES.BISHOP, `f${rowLabel}`),
    makePiece(color, PIECE_TYPES.KNIGHT, `g${rowLabel}`),
    makePiece(color, PIECE_TYPES.ROOK, `h${rowLabel}`),
  ];
}

function createPawnRank(color, rowLabel) {
  const files = ['a','b','c','d','e','f','g','h'];
  return files.map(file => makePiece(color, PIECE_TYPES.PAWN, `${file}${rowLabel}`));
}

export function createInitialBoard() {
  return [
    createBackRank(COLORS.BLACK, 8),
    createPawnRank(COLORS.BLACK, 7),
    Array(8).fill(null),
    Array(8).fill(null),
    Array(8).fill(null),
    Array(8).fill(null),
    createPawnRank(COLORS.WHITE, 2),
    createBackRank(COLORS.WHITE, 1),
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
    isSandbox: false,
    sandboxHistory: [],
    specializedStatusById: {},
    specializedSetupSide: 'white',
    lastMovedPieceIdByColor: { white: null, black: null },
    specializedCaptureCountsById: {},
  };
}
