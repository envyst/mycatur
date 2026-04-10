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
  'Iron Pawn': {
    baseType: 'pawn',
    rules: {
      canCapture: false,
      canBeCaptured: false,
      canPromote: false,
      canEnPassantCapture: false,
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
  'Icicle': {
    baseType: 'bishop',
    rules: {
      canCapture: false,
      freezesAdjacentEnemies: true,
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

export function getSpecializedDefinitionFromPiece(piece) {
  if (!piece?.specialization) return null;
  const def = SPECIALIZED_EFFECTS[piece.specialization] || null;
  if (!def) return null;
  return {
    definition: def,
    rules: def.rules || {},
  };
}

export function getSpecializedRulesFromPiece(piece) {
  return getSpecializedDefinitionFromPiece(piece)?.rules || {};
}


export function pieceHasParalysisFromBasilisk(board, gameState, row, col) {
  const piece = board?.[row]?.[col];
  if (!piece) return false;
  const enemyColor = piece.color === 'white' ? 'black' : 'white';

  for (let r = 0; r < board.length; r += 1) {
    for (let c = 0; c < board[r].length; c += 1) {
      const attacker = board[r][c];
      if (!attacker || attacker.color !== enemyColor) continue;
      const rules = getSpecializedRulesFromPiece(attacker);
      if (!rules.paralyzesAttackedPieces) continue;
      if (attacker.type !== 'bishop') continue;

      const dr = row - r;
      const dc = col - c;
      if (Math.abs(dr) !== Math.abs(dc) || dr === 0) continue;

      const stepR = dr > 0 ? 1 : -1;
      const stepC = dc > 0 ? 1 : -1;
      let cr = r + stepR;
      let cc = c + stepC;
      let blocked = false;
      while (cr !== row && cc !== col) {
        if (board[cr][cc]) {
          blocked = true;
          break;
        }
        cr += stepR;
        cc += stepC;
      }
      if (!blocked) return true;
    }
  }
  return false;
}


export function pieceHasCaptureSuppressionFromAdjacentEnemy(board, row, col) {
  const piece = board?.[row]?.[col];
  if (!piece) return false;
  const enemyColor = piece.color === 'white' ? 'black' : 'white';
  for (let r = Math.max(0, row - 1); r <= Math.min(7, row + 1); r += 1) {
    for (let c = Math.max(0, col - 1); c <= Math.min(7, col + 1); c += 1) {
      if (r === row && c === col) continue;
      const other = board?.[r]?.[c];
      if (!other || other.color !== enemyColor) continue;
      const rules = getSpecializedRulesFromPiece(other);
      if (rules.suppressesAdjacentEnemyCaptures) return true;
    }
  }
  return false;
}


export function boardHasGlobalPromotionBlocker(board) {
  for (let row = 0; row < (board?.length || 0); row += 1) {
    for (let col = 0; col < (board?.[row]?.length || 0); col += 1) {
      const piece = board[row][col];
      if (!piece) continue;
      const rules = getSpecializedRulesFromPiece(piece);
      if (rules.blocksAllPromotion) return true;
    }
  }
  return false;
}


export function collectAdjacentEnemyIdsForIcicles(board) {
  const adjacentEnemyIds = new Set();
  for (let row = 0; row < (board?.length || 0); row += 1) {
    for (let col = 0; col < (board?.[row]?.length || 0); col += 1) {
      const piece = board[row][col];
      if (!piece) continue;
      const rules = getSpecializedRulesFromPiece(piece);
      if (!rules.freezesAdjacentEnemies) continue;
      for (let r = Math.max(0, row - 1); r <= Math.min(7, row + 1); r += 1) {
        for (let c = Math.max(0, col - 1); c <= Math.min(7, col + 1); c += 1) {
          if (r === row && c === col) continue;
          const other = board?.[r]?.[c];
          if (!other || other.color === piece.color || !other.id) continue;
          adjacentEnemyIds.add(other.id);
        }
      }
    }
  }
  return adjacentEnemyIds;
}
