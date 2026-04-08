import { getSpecializedPieceAt } from './specialized.js';

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

export function getSpecializedDefinition(gameState, row, col) {
  const assigned = getSpecializedPieceAt(gameState?.specializedAssignments || { white: [], black: [] }, row, col);
  if (!assigned) return null;
  const def = SPECIALIZED_EFFECTS[assigned.specialization] || null;
  if (!def) return null;
  return {
    assignment: assigned,
    definition: def,
    rules: def.rules || {},
  };
}

export function getSpecializedRules(gameState, row, col) {
  return getSpecializedDefinition(gameState, row, col)?.rules || {};
}
