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
