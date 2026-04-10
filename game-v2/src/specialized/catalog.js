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
