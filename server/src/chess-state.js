export function createInitialBoard() {
  const back = color => ([
    { color, type: 'rook' },
    { color, type: 'knight' },
    { color, type: 'bishop' },
    { color, type: 'queen' },
    { color, type: 'king' },
    { color, type: 'bishop' },
    { color, type: 'knight' },
    { color, type: 'rook' },
  ]);
  const pawns = color => Array.from({ length: 8 }, () => ({ color, type: 'pawn' }));
  return [
    back('black'),
    pawns('black'),
    Array(8).fill(null),
    Array(8).fill(null),
    Array(8).fill(null),
    Array(8).fill(null),
    pawns('white'),
    back('white'),
  ];
}

export function createInitialGameState(mode = 'human-vs-human') {
  return {
    mode,
    status: 'active',
    result: null,
    currentTurn: 'white',
    board: createInitialBoard(),
    castlingRights: {
      white: { kingSide: true, queenSide: true },
      black: { kingSide: true, queenSide: true },
    },
    enPassantTarget: null,
    halfmoveClock: 0,
    fullmoveNumber: 1,
    positionHistory: {},
    pgnText: '',
  };
}
