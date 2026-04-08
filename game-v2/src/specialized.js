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

function filesIndex(file) {
  return 'abcdefgh'.indexOf(file);
}

export function squareToCoords(square) {
  return {
    row: 8 - Number(square[1]),
    col: filesIndex(square[0]),
  };
}

export function buildSpecializedBoardMap(assignments) {
  const map = {};
  ['white', 'black'].forEach(side => {
    (assignments[side] || []).forEach(item => {
      const { row, col } = squareToCoords(item.square);
      map[`${row}:${col}`] = item;
    });
  });
  return map;
}

export function getSpecializedPieceAt(assignments, row, col) {
  const map = buildSpecializedBoardMap(assignments);
  return map[`${row}:${col}`] || null;
}

export function isIronPawnAt(assignments, row, col) {
  const item = getSpecializedPieceAt(assignments, row, col);
  return item?.specialization === 'Iron Pawn';
}


export function friendlySquareLabel(side, pieceType, square) {
  const sideMap = SPECIALIZED_STARTING_SQUARES[side]?.[pieceType] || [];
  if (sideMap.length === 2) {
    if (pieceType === 'knight') {
      return square === sideMap[0] ? `${square} - left knight` : `${square} - right knight`;
    }
    if (pieceType === 'bishop') {
      return square === sideMap[0] ? `${square} - left bishop` : `${square} - right bishop`;
    }
    if (pieceType === 'rook') {
      return square === sideMap[0] ? `${square} - left rook` : `${square} - right rook`;
    }
  }
  return `${square} - ${pieceType}`;
}

export function specializationMarkerLabel(name) {
  return name
    .split(/\s+/)
    .map(part => part[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
}
