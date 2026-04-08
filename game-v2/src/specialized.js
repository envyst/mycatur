export const SPECIALIZED_CATALOG = {
  bishop: [
    'Aristocat',
    'Basilisk',
    'Blade Runner',
    'Bouncer',
    'Cardinal',
    'Dancer',
    'Djinn',
    'Gunslinger',
    'Horde Mother',
    'Icicle',
    'Marauder',
    'Pillgrim',
  ],
  knight: [
    'Anti Violence',
    'Banker',
    'Camel',
    'Electroknight',
    'Fish',
    'Knightmare',
    'Pinata',
  ],
  pawn: [
    'Blueprint',
    'Epee Pawn',
    'Golden Pawn',
    'Hero Pawn',
    'Iron Pawn',
    'Pawn with Knife',
    'War Automator',
    'Warp Jumper',
  ],
  rook: [
    'Phase Rook',
    'Sumo Rook',
  ],
  queen: [
    'Fission Reactor',
  ],
  king: [
    'Rocketman',
  ],
};

export const SPECIALIZED_STARTING_SQUARES = {
  white: {
    rook: ['a1', 'h1'],
    knight: ['b1', 'g1'],
    bishop: ['c1', 'f1'],
    queen: ['d1'],
    king: ['e1'],
    pawn: ['a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2'],
  },
  black: {
    rook: ['a8', 'h8'],
    knight: ['b8', 'g8'],
    bishop: ['c8', 'f8'],
    queen: ['d8'],
    king: ['e8'],
    pawn: ['a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7'],
  },
};

export function createEmptyAssignments() {
  return {
    white: [],
    black: [],
  };
}

export function countAssignments(assignments, side) {
  return assignments[side]?.length || 0;
}

export function canAssignMore(assignments, side) {
  return countAssignments(assignments, side) < 6;
}

export function getAssignment(assignments, side, square) {
  return (assignments[side] || []).find(item => item.square === square) || null;
}

export function setAssignment(assignments, side, square, pieceType, specialization) {
  const current = assignments[side] || [];
  const filtered = current.filter(item => item.square !== square);
  if (!specialization) {
    return {
      ...assignments,
      [side]: filtered,
    };
  }
  if (filtered.length >= 6) {
    return assignments;
  }
  return {
    ...assignments,
    [side]: [...filtered, { square, pieceType, specialization }],
  };
}
