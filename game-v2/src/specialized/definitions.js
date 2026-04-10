export const SPECIALIZED_EFFECTS = {
  'Aristocat': {
    baseType: 'bishop',
    rules: {
      blocksAllPromotion: true,
    },
  },
  'Anti Violence': {
    baseType: 'knight',
    rules: {
      canCapture: false,
      suppressesAdjacentEnemyCaptures: true,
    },
  },
  'Basilisk': {
    baseType: 'bishop',
    rules: {
      canCapture: false,
      paralyzesAttackedPieces: true,
    },
  },
  'Cardinal': {
    baseType: 'bishop',
    rules: {
      canStepDirectlyBackward: true,
    },
  },
  'Camel': {
    baseType: 'knight',
    rules: {
      leapPattern: 'camel',
    },
  },
  'Fish': {
    baseType: 'knight',
    rules: {
      gainsOneStepAfterMovingLastTurn: true,
    },
  },
  'Hero Pawn': {
    baseType: 'pawn',
    rules: {
      promoteImmediatelyOnCheck: true,
    },
  },
  'Icicle': {
    baseType: 'bishop',
    rules: {
      canCapture: false,
      freezesAdjacentEnemies: true,
    },
  },
  'Iron Pawn': {
    baseType: 'pawn',
    rules: {
      canCapture: false,
      canBeCaptured: false,
      canPromote: false,
      canEnPassantCapture: false,
    },
  },
  'Pawn with Knife': {
    baseType: 'pawn',
    rules: {
      extendedCenterDiagonalCapture: true,
    },
  },
  'Phase Rook': {
    baseType: 'rook',
    rules: {
      canPassThroughAllies: true,
      cannotCaptureThroughAllies: true,
    },
  },
};
