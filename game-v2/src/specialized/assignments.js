export function createEmptyAssignments() {
  return {
    white: [null],
    black: [null],
  };
}

export function countAssignments(assignments, side) {
  return (assignments?.[side] || []).filter(Boolean).length;
}

export function canAssignMore(assignments, side) {
  return countAssignments(assignments, side) < 16;
}

export function getAssignment(assignments, side, square) {
  return (assignments?.[side] || []).filter(Boolean).find(item => item.square === square) || null;
}

export function setAssignment(assignments, side, square, pieceType, specialization) {
  const current = Array.from({ length: assignments?.[side]?.length || 1 }, (_, i) => assignments?.[side]?.[i] || null);
  const filteredSquares = current.filter(Boolean).filter(item => item.square !== square);
  if (!specialization) {
    return {
      ...assignments,
      [side]: current.map(item => (item && item.square === square ? null : item)),
    };
  }
  if (filteredSquares.length >= 16 && !current.some(item => item && item.square === square)) {
    return assignments;
  }
  const idx = current.findIndex(item => item && item.square === square);
  if (idx >= 0) current[idx] = { square, pieceType, specialization };
  else {
    const emptyIdx = current.findIndex(item => item === null);
    if (emptyIdx >= 0) current[emptyIdx] = { square, pieceType, specialization };
    else current.push({ square, pieceType, specialization });
  }
  return {
    ...assignments,
    [side]: current,
  };
}

function filesIndex(file) {
  return 'abcdefgh'.indexOf(file);
}

export function squareToCoords(square) {
  if (!square || typeof square !== 'string' || square.length < 2) return null;
  const row = 8 - Number(square[1]);
  const col = filesIndex(square[0]);
  if (Number.isNaN(row) || col < 0) return null;
  return { row, col };
}

export function buildSpecializedBoardMap(assignments) {
  const map = {};
  ['white', 'black'].forEach(side => {
    (assignments?.[side] || []).filter(Boolean).forEach(item => {
      if (!item?.square || !item?.specialization || !item?.pieceType) return;
      const coords = squareToCoords(item.square);
      if (!coords) return;
      map[`${coords.row}:${coords.col}`] = item;
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
