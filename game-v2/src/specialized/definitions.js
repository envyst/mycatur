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
  'Banker': {
    baseType: 'knight',
    rules: {
      upgradesPawnToGoldenOnPawnCapture: true,
    },
  },
  'Basilisk': {
    baseType: 'bishop',
    rules: {
      canCapture: false,
      paralyzesAttackedPieces: true,
    },
  },
  'Bouncer': {
    baseType: 'bishop',
    rules: {
      canBounceOnceOffEdge: true,
    },
  },
  'Blueprint': {
    baseType: 'pawn',
    rules: {
      transformsFromLeftNeighborAtStart: true,
    },
  },
  'Cardinal': {
    baseType: 'bishop',
    rules: {
      canStepDirectlyBackward: true,
    },
  },
  'Dancer': {
    baseType: 'bishop',
    rules: {
      gainsSpecialTwoStepAfterChecking: true,
    },
  },
  'Electroknight': {
    baseType: 'knight',
    rules: {
      chargesAfterThreeConsecutiveOwnMoves: true,
    },
  },
  'Epee Pawn': {
    baseType: 'pawn',
    rules: {
      canGlobalEnPassant: true,
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
  'Fission Reactor': {
    baseType: 'queen',
    rules: {
      explodesOnFifthCapture: true,
    },
  },
  'Golden Pawn': {
    baseType: 'pawn',
    rules: {
      killsKingOnLastRank: true,
      canPromote: false,
    },
  },
  'Gunslinger': {
    baseType: 'bishop',
    rules: {
      gunslingerMutualThreatKill: true,
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
  'Marauder': {
    baseType: 'bishop',
    rules: {
      dynamicMarauderRange: true,
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
  'Warp Jumper': {
    baseType: 'pawn',
    rules: {
      canJumpEnemyPawnChainsForward: true,
    },
  },
  'War Automaton': {
    baseType: 'pawn',
    rules: {
      autoAdvanceOnAnyCapture: true,
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
