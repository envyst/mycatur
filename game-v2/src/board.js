import { BOARD_SIZE, COLORS } from './config.js';
import { PIECE_TYPES } from './pieces.js';
import { getSpecializedRulesFromPiece } from './specialized-effects.js';

export function isInsideBoard(row, col) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

export function cloneBoard(board) {
  return board.map(row => row.map(piece => (piece ? { ...piece } : null)));
}

export function cloneCastlingRights(castlingRights) {
  return {
    white: { ...castlingRights.white },
    black: { ...castlingRights.black },
  };
}

export function getPiece(board, row, col) {
  if (!isInsideBoard(row, col)) return null;
  return board[row][col];
}

function isPromotionSquare(piece, row, gameState, col) {
  const pieceAtSquare = getPiece(gameState.board, row, col);
  const rules = getSpecializedRulesFromPiece(pieceAtSquare);
  if (piece.type === PIECE_TYPES.PAWN && rules.canPromote === false) {
    return false;
  }
  return piece.type === PIECE_TYPES.PAWN && ((piece.color === COLORS.WHITE && row === 0) || (piece.color === COLORS.BLACK && row === 7));
}

function disableCastlingForRookSquare(castlingRights, color, row, col) {
  if (color === COLORS.WHITE && row === 7 && col === 0) castlingRights.white.queenSide = false;
  if (color === COLORS.WHITE && row === 7 && col === 7) castlingRights.white.kingSide = false;
  if (color === COLORS.BLACK && row === 0 && col === 0) castlingRights.black.queenSide = false;
  if (color === COLORS.BLACK && row === 0 && col === 7) castlingRights.black.kingSide = false;
}

export function createPositionKey(board, currentTurn, castlingRights, enPassantTarget) {
  const boardKey = board
    .map(row => row.map(piece => {
      if (!piece) return '--';
      const prefix = piece.color === COLORS.WHITE ? 'w' : 'b';
      return `${prefix}${piece.type[0]}`;
    }).join(','))
    .join('/');

  const castleKey = [
    castlingRights.white.kingSide ? 'K' : '',
    castlingRights.white.queenSide ? 'Q' : '',
    castlingRights.black.kingSide ? 'k' : '',
    castlingRights.black.queenSide ? 'q' : '',
  ].join('') || '-';

  const epKey = enPassantTarget ? `${enPassantTarget.row}:${enPassantTarget.col}` : '-';
  return `${boardKey}|${currentTurn}|${castleKey}|${epKey}`;
}

export function applyMove(board, fromRow, fromCol, toRow, toCol, gameState) {
  const nextBoard = cloneBoard(board);
  const piece = nextBoard[fromRow][fromCol];
  const target = nextBoard[toRow][toCol];
  const nextCastlingRights = cloneCastlingRights(gameState.castlingRights);
  let nextEnPassantTarget = null;
  let promotion = null;
  let notation = null;
  let isCapture = Boolean(target);
  let resetsHalfmoveClock = false;

  if (!piece) {
    return {
      board: nextBoard,
      castlingRights: nextCastlingRights,
      enPassantTarget: nextEnPassantTarget,
      promotion,
      notation,
      isCapture,
      resetsHalfmoveClock,
    };
  }

  if (target && target.type === PIECE_TYPES.ROOK) {
    disableCastlingForRookSquare(nextCastlingRights, target.color, toRow, toCol);
  }

  if (piece.type === PIECE_TYPES.KING) {
    nextCastlingRights[piece.color].kingSide = false;
    nextCastlingRights[piece.color].queenSide = false;
  }

  if (piece.type === PIECE_TYPES.ROOK) {
    disableCastlingForRookSquare(nextCastlingRights, piece.color, fromRow, fromCol);
  }

  if (piece.type === PIECE_TYPES.PAWN && gameState.enPassantTarget && toRow === gameState.enPassantTarget.row && toCol === gameState.enPassantTarget.col && !target) {
    const captureRow = piece.color === COLORS.WHITE ? toRow + 1 : toRow - 1;
    nextBoard[captureRow][toCol] = null;
    notation = 'en passant';
    isCapture = true;
  }

  nextBoard[toRow][toCol] = piece;
  nextBoard[fromRow][fromCol] = null;

  if (piece.type === PIECE_TYPES.KING && Math.abs(toCol - fromCol) === 2) {
    if (toCol === 6) {
      nextBoard[toRow][5] = nextBoard[toRow][7];
      nextBoard[toRow][7] = null;
      notation = 'castle kingside';
    } else if (toCol === 2) {
      nextBoard[toRow][3] = nextBoard[toRow][0];
      nextBoard[toRow][0] = null;
      notation = 'castle queenside';
    }
  }

  if (piece.type === PIECE_TYPES.PAWN && Math.abs(toRow - fromRow) === 2) {
    nextEnPassantTarget = {
      row: (fromRow + toRow) / 2,
      col: fromCol,
    };
  }

  if (isPromotionSquare(piece, toRow, gameState, toCol)) {
    promotion = {
      row: toRow,
      col: toCol,
      color: piece.color,
    };
  }

  resetsHalfmoveClock = piece.type === PIECE_TYPES.PAWN || isCapture;

  return {
    board: nextBoard,
    castlingRights: nextCastlingRights,
    enPassantTarget: nextEnPassantTarget,
    promotion,
    notation,
    isCapture,
    resetsHalfmoveClock,
  };
}

function collectDirectionalMoves(board, row, col, color, directions, gameState) {
  const moves = [];

  for (const [dr, dc] of directions) {
    let r = row + dr;
    let c = col + dc;

    while (isInsideBoard(r, c)) {
      const target = board[r][c];
      if (!target) {
        moves.push({ row: r, col: c });
      } else {
        if (target.color !== color) {
          if (!(gameState?.mode === 'specialized' && isIronPawnAt(gameState.specializedAssignments, r, c))) {
            moves.push({ row: r, col: c });
          }
        }
        break;
      }
      r += dr;
      c += dc;
    }
  }

  return moves;
}

export function getPseudoLegalMoves(board, row, col, gameState = {}) {
  const piece = getPiece(board, row, col);
  if (!piece) return [];

  const { color, type } = piece;
  const moves = [];

  if (type === PIECE_TYPES.PAWN) {
    const dir = color === COLORS.WHITE ? -1 : 1;
    const startRow = color === COLORS.WHITE ? 6 : 1;
    const pieceAtSquare = getPiece(gameState.board, row, col);
  const rules = getSpecializedRulesFromPiece(pieceAtSquare);

    const oneStep = row + dir;
    if (isInsideBoard(oneStep, col) && !getPiece(board, oneStep, col)) {
      moves.push({ row: oneStep, col });

      const twoStep = row + dir * 2;
      if (isInsideBoard(twoStep, col) && row === startRow && !getPiece(board, twoStep, col)) {
        moves.push({ row: twoStep, col });
      }
    }

    if (rules.canCapture !== false) {
      for (const dc of [-1, 1]) {
        const targetRow = row + dir;
        const targetCol = col + dc;
        const target = getPiece(board, targetRow, targetCol);
        if (target && target.color !== color) {
          const targetRules = getSpecializedRulesFromPiece(target);
          if (targetRules.canBeCaptured !== false) {
            moves.push({ row: targetRow, col: targetCol });
          }
        }
      }

      if (rules.canEnPassantCapture !== false && gameState.enPassantTarget) {
        const ep = gameState.enPassantTarget;
        if (ep.row === row + dir && Math.abs(ep.col - col) === 1) {
          moves.push({ row: ep.row, col: ep.col });
        }
      }
    }

    return moves.filter(move => isInsideBoard(move.row, move.col));
  }

  if (type === PIECE_TYPES.KNIGHT) {
    const jumps = [
      [-2, -1], [-2, 1],
      [-1, -2], [-1, 2],
      [1, -2], [1, 2],
      [2, -1], [2, 1],
    ];

    for (const [dr, dc] of jumps) {
      const r = row + dr;
      const c = col + dc;
      if (!isInsideBoard(r, c)) continue;
      const target = getPiece(board, r, c);
      if (!target) {
        moves.push({ row: r, col: c });
      } else if (target.color !== color) {
        const targetRules = getSpecializedRulesFromPiece(target);
        if (targetRules.canBeCaptured !== false) {
          moves.push({ row: r, col: c });
        }
      }
    }

    return moves;
  }

  if (type === PIECE_TYPES.BISHOP) {
    return collectDirectionalMoves(board, row, col, color, [[-1, -1], [-1, 1], [1, -1], [1, 1]], gameState);
  }

  if (type === PIECE_TYPES.ROOK) {
    return collectDirectionalMoves(board, row, col, color, [[-1, 0], [1, 0], [0, -1], [0, 1]], gameState);
  }

  if (type === PIECE_TYPES.QUEEN) {
    return collectDirectionalMoves(board, row, col, color, [
      [-1, -1], [-1, 1], [1, -1], [1, 1],
      [-1, 0], [1, 0], [0, -1], [0, 1],
    ], gameState);
  }

  if (type === PIECE_TYPES.KING) {
    const dirs = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1],
    ];

    for (const [dr, dc] of dirs) {
      const r = row + dr;
      const c = col + dc;
      if (!isInsideBoard(r, c)) continue;
      const target = getPiece(board, r, c);
      if (!target) {
        moves.push({ row: r, col: c });
      } else if (target.color !== color) {
        const targetRules = getSpecializedRulesFromPiece(target);
        if (targetRules.canBeCaptured !== false) {
          moves.push({ row: r, col: c });
        }
      }
    }

    const rights = gameState.castlingRights?.[color];
    const homeRow = color === COLORS.WHITE ? 7 : 0;
    if (row === homeRow && col === 4 && rights) {
      if (rights.kingSide && !getPiece(board, homeRow, 5) && !getPiece(board, homeRow, 6)) {
        const rook = getPiece(board, homeRow, 7);
        if (rook && rook.color === color && rook.type === PIECE_TYPES.ROOK) {
          moves.push({ row: homeRow, col: 6 });
        }
      }
      if (rights.queenSide && !getPiece(board, homeRow, 1) && !getPiece(board, homeRow, 2) && !getPiece(board, homeRow, 3)) {
        const rook = getPiece(board, homeRow, 0);
        if (rook && rook.color === color && rook.type === PIECE_TYPES.ROOK) {
          moves.push({ row: homeRow, col: 2 });
        }
      }
    }

    return moves;
  }

  return moves;
}

export function findKing(board, color) {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const piece = board[row][col];
      if (piece && piece.color === color && piece.type === PIECE_TYPES.KING) {
        return { row, col };
      }
    }
  }
  return null;
}

export function isSquareAttacked(board, targetRow, targetCol, byColor) {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const piece = board[row][col];
      if (!piece || piece.color !== byColor) continue;

      if (piece.type === PIECE_TYPES.PAWN) {
        const dir = byColor === COLORS.WHITE ? -1 : 1;
        for (const dc of [-1, 1]) {
          if (row + dir === targetRow && col + dc === targetCol) {
            return true;
          }
        }
        continue;
      }

      if (piece.type === PIECE_TYPES.KING) {
        if (Math.abs(row - targetRow) <= 1 && Math.abs(col - targetCol) <= 1) {
          return true;
        }
        continue;
      }

      const moves = getPseudoLegalMoves(board, row, col, { castlingRights: null, enPassantTarget: null, specializedAssignments: null, mode: 'human-vs-human' });
      if (moves.some(move => move.row === targetRow && move.col === targetCol)) {
        return true;
      }
    }
  }

  return false;
}

export function isKingInCheck(board, color) {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  const opponent = color === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
  return isSquareAttacked(board, kingPos.row, kingPos.col, opponent);
}

function isCastlingMove(piece, fromCol, toCol) {
  return piece.type === PIECE_TYPES.KING && Math.abs(toCol - fromCol) === 2;
}

export function getLegalMoves(board, row, col, gameState) {
  const piece = getPiece(board, row, col);
  if (!piece) return [];

  const pseudoMoves = getPseudoLegalMoves(board, row, col, gameState);
  return pseudoMoves.filter(move => {
    if (isCastlingMove(piece, col, move.col)) {
      const homeRow = piece.color === COLORS.WHITE ? 7 : 0;
      const stepCol = move.col > col ? 5 : 3;
      const finalCol = move.col;
      const opponent = piece.color === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;

      if (isKingInCheck(board, piece.color)) return false;
      if (isSquareAttacked(board, homeRow, stepCol, opponent)) return false;
      if (isSquareAttacked(board, homeRow, finalCol, opponent)) return false;
    }

    const applied = applyMove(board, row, col, move.row, move.col, gameState);
    return !isKingInCheck(applied.board, piece.color);
  });
}

export function hasAnyLegalMove(board, color, gameState) {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const piece = board[row][col];
      if (!piece || piece.color !== color) continue;
      if (getLegalMoves(board, row, col, gameState).length > 0) {
        return true;
      }
    }
  }
  return false;
}
