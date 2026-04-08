export const SPECIALIZED_EFFECTS = {
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
