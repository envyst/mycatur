import { BOARD_SIZE, COLORS } from './config.js';
import { PIECE_TYPES } from './pieces.js';
import { getSpecializedRulesFromPiece, pieceHasParalysisFromBasilisk, pieceHasCaptureSuppressionFromAdjacentEnemy, boardHasGlobalPromotionBlocker, buildDerivedSpecializedState } from './specialized/effects.js';

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
  const rules = getSpecializedRulesFromPiece(piece);
  if (boardHasGlobalPromotionBlocker(gameState?.board || gameState?.boardState || gameState?.nextBoard || [])) {
    return false;
  }
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

  const movedPieceRules = getSpecializedRulesFromPiece(piece);
  if (!promotion && movedPieceRules.promoteImmediatelyOnCheck && piece.type === PIECE_TYPES.PAWN && !boardHasGlobalPromotionBlocker(nextBoard)) {
    const nextTurn = piece.color === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
    if (isKingInCheck(nextBoard, nextTurn, { ...gameState, board: nextBoard, currentTurn: nextTurn })) {
      promotion = {
        row: toRow,
        col: toCol,
        color: piece.color,
      };
    }
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


function collectBouncerMoves(board, row, col, color, gameState) {
  const moves = [];
  const movingPiece = getPiece(board, row, col);
  const movingRules = getSpecializedRulesFromPiece(movingPiece);
  const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

  for (const [startDr, startDc] of directions) {
    let dr = startDr;
    let dc = startDc;
    let r = row;
    let c = col;
    let bounced = false;

    while (true) {
      const nextR = r + dr;
      const nextC = c + dc;

      if (!isInsideBoard(nextR, nextC)) {
        if (bounced) break;
        const hitTopBottom = nextR < 0 || nextR >= BOARD_SIZE;
        const hitLeftRight = nextC < 0 || nextC >= BOARD_SIZE;
        if (!hitTopBottom && !hitLeftRight) break;
        if (hitTopBottom) dr *= -1;
        if (hitLeftRight) dc *= -1;
        bounced = true;
        continue;
      }

      r = nextR;
      c = nextC;
      const target = board[r][c];

      if (!target) {
        moves.push({ row: r, col: c });
        continue;
      }

      if (target.color === color) {
        // allies block normally; they never trigger bounce
        break;
      }

      const targetRules = getSpecializedRulesFromPiece(target);
      const captureSuppressed = gameState?.isSpecialized && pieceHasCaptureSuppressionFromAdjacentEnemy(board, row, col);
      if (!captureSuppressed && movingRules.canCapture !== false && targetRules.canBeCaptured !== false) {
        moves.push({ row: r, col: c });
      }
      break;
    }
  }

  return moves;
}

function collectDirectionalMoves(board, row, col, color, directions, gameState) {
  const moves = [];

  const movingPiece = getPiece(board, row, col);
  const movingRules = getSpecializedRulesFromPiece(movingPiece);

  for (const [dr, dc] of directions) {
    let r = row + dr;
    let c = col + dc;
    let passedThroughAlly = false;

    while (isInsideBoard(r, c)) {
      const target = board[r][c];
      if (!target) {
        moves.push({ row: r, col: c });
      } else if (target.color === color) {
        if (movingRules.canPassThroughAllies) {
          passedThroughAlly = true;
        } else {
          break;
        }
      } else {
        const targetRules = getSpecializedRulesFromPiece(target);
        const captureSuppressed = gameState?.isSpecialized && pieceHasCaptureSuppressionFromAdjacentEnemy(board, row, col);
        const captureBlockedByPassedAlly = movingRules.cannotCaptureThroughAllies && passedThroughAlly;
        if (!captureSuppressed && !captureBlockedByPassedAlly && movingRules.canCapture !== false && targetRules.canBeCaptured !== false) {
          moves.push({ row: r, col: c });
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
    const rules = getSpecializedRulesFromPiece(piece);

    const oneStep = row + dir;
    if (isInsideBoard(oneStep, col) && !getPiece(board, oneStep, col)) {
      moves.push({ row: oneStep, col });

      const twoStep = row + dir * 2;
      if (isInsideBoard(twoStep, col) && row === startRow && !getPiece(board, twoStep, col)) {
        moves.push({ row: twoStep, col });
      }
    }

    const captureSuppressed = gameState?.isSpecialized && pieceHasCaptureSuppressionFromAdjacentEnemy(board, row, col);

    if (rules.canCapture !== false && !captureSuppressed) {
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

      if (rules.extendedCenterDiagonalCapture) {
        const towardCenterDc = col <= 3 ? 1 : -1;
        const midRow = row + dir;
        const midCol = col + towardCenterDc;
        const targetRow = row + (2 * dir);
        const targetCol = col + (2 * towardCenterDc);
        if (isInsideBoard(midRow, midCol) && isInsideBoard(targetRow, targetCol) && !getPiece(board, midRow, midCol)) {
          const target = getPiece(board, targetRow, targetCol);
          if (target && target.color !== color) {
            const targetRules = getSpecializedRulesFromPiece(target);
            if (targetRules.canBeCaptured !== false) {
              moves.push({ row: targetRow, col: targetCol });
            }
          }
        }
      }

      if (rules.canEnPassantCapture !== false && gameState.enPassantTarget) {
        const ep = gameState.enPassantTarget;
        const victimRow = color === COLORS.WHITE ? ep.row + 1 : ep.row - 1;
        const victim = getPiece(board, victimRow, ep.col);
        const victimRules = getSpecializedRulesFromPiece(victim);
        const canUseNormalEnPassant = ep.row === row + dir && Math.abs(ep.col - col) === 1;
        const canUseGlobalEpeeEnPassant = rules.canGlobalEnPassant === true && ep.row === row + dir;
        if ((canUseNormalEnPassant || canUseGlobalEpeeEnPassant) && victimRules.canBeCaptured !== false) {
          moves.push({ row: ep.row, col: ep.col });
        }
      }
    }

    return moves.filter(move => isInsideBoard(move.row, move.col));
  }

  if (type === PIECE_TYPES.KNIGHT) {
    const movingRules = getSpecializedRulesFromPiece(piece);
    const jumps = movingRules.leapPattern === 'camel'
      ? [
          [-3, -1], [-3, 1],
          [-1, -3], [-1, 3],
          [1, -3], [1, 3],
          [3, -1], [3, 1],
        ]
      : [
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
        const captureSuppressed = gameState?.isSpecialized && pieceHasCaptureSuppressionFromAdjacentEnemy(board, row, col);
        if (movingRules.canCapture !== false && !captureSuppressed && targetRules.canBeCaptured !== false) {
          moves.push({ row: r, col: c });
        }
      }
    }

    if (movingRules.gainsOneStepAfterMovingLastTurn && gameState?.lastMovedPieceIdByColor?.[piece.color] === piece.id) {
      const oneSteps = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1],
      ];
      for (const [dr, dc] of oneSteps) {
        const r = row + dr;
        const c = col + dc;
        if (!isInsideBoard(r, c)) continue;
        const target = getPiece(board, r, c);
        if (!target) {
          moves.push({ row: r, col: c });
        }
      }
    }

    return moves;
  }

  if (type === PIECE_TYPES.BISHOP) {
    const rules = getSpecializedRulesFromPiece(piece);
    const moves = rules.canBounceOnceOffEdge
      ? collectBouncerMoves(board, row, col, color, gameState)
      : collectDirectionalMoves(board, row, col, color, [[-1, -1], [-1, 1], [1, -1], [1, 1]], gameState);
    if (rules.canStepDirectlyBackward) {
      const backwardRow = color === COLORS.WHITE ? row + 1 : row - 1;
      if (isInsideBoard(backwardRow, col) && !getPiece(board, backwardRow, col)) {
        moves.push({ row: backwardRow, col });
      }
    }
    return moves;
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
        const movingRules = getSpecializedRulesFromPiece(piece);
        const captureSuppressed = gameState?.isSpecialized && pieceHasCaptureSuppressionFromAdjacentEnemy(board, row, col);
        if (movingRules.canCapture !== false && !captureSuppressed && targetRules.canBeCaptured !== false) {
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

export function isSquareAttacked(board, targetRow, targetCol, byColor, gameState = {}) {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const piece = board[row][col];
      if (!piece || piece.color !== byColor) continue;
      const pieceRules = getSpecializedRulesFromPiece(piece);
      const captureSuppressed = gameState?.isSpecialized && pieceHasCaptureSuppressionFromAdjacentEnemy(board, row, col);
      if (gameState?.isSpecialized && pieceHasParalysisFromBasilisk(board, gameState, row, col)) continue;

      if (piece.type === PIECE_TYPES.PAWN) {
        if (pieceRules.canCapture === false || captureSuppressed) continue;
        const dir = byColor === COLORS.WHITE ? -1 : 1;
        for (const dc of [-1, 1]) {
          if (row + dir === targetRow && col + dc === targetCol) {
            return true;
          }
        }
        continue;
      }

      if (piece.type === PIECE_TYPES.KING) {
        if (pieceRules.canCapture === false || captureSuppressed) continue;
        if (Math.abs(row - targetRow) <= 1 && Math.abs(col - targetCol) <= 1) {
          return true;
        }
        continue;
      }

      const moves = getPseudoLegalMoves(board, row, col, {
        castlingRights: null,
        enPassantTarget: null,
        isSpecialized: gameState?.isSpecialized || false,
        specializedStatusById: gameState?.specializedStatusById || {},
        lastMovedPieceIdByColor: gameState?.lastMovedPieceIdByColor || { white: null, black: null },
      });
      if (moves.some(move => move.row === targetRow && move.col === targetCol)) {
        return true;
      }
    }
  }

  return false;
}

export function isKingInCheck(board, color, gameState = {}) {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  const opponent = color === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
  return isSquareAttacked(board, kingPos.row, kingPos.col, opponent, gameState);
}

function isCastlingMove(piece, fromCol, toCol) {
  return piece.type === PIECE_TYPES.KING && Math.abs(toCol - fromCol) === 2;
}

export function getLegalMoves(board, row, col, gameState) {
  const piece = getPiece(board, row, col);
  if (!piece) return [];
  if (gameState?.isSpecialized && pieceHasParalysisFromBasilisk(board, gameState, row, col)) return [];
  if (gameState?.isSpecialized && piece?.id && gameState?.specializedStatusById?.[piece.id]?.frozen) return [];

  const pseudoMoves = getPseudoLegalMoves(board, row, col, gameState);
  return pseudoMoves.filter(move => {
    if (isCastlingMove(piece, col, move.col)) {
      const homeRow = piece.color === COLORS.WHITE ? 7 : 0;
      const stepCol = move.col > col ? 5 : 3;
      const finalCol = move.col;
      const opponent = piece.color === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;

      if (isKingInCheck(board, piece.color, buildDerivedSpecializedState(board, gameState))) return false;
      if (isSquareAttacked(board, homeRow, stepCol, opponent, gameState)) return false;
      if (isSquareAttacked(board, homeRow, finalCol, opponent, gameState)) return false;
    }

    const applied = applyMove(board, row, col, move.row, move.col, gameState);
    const derivedState = buildDerivedSpecializedState(applied.board, gameState);
    return !isKingInCheck(applied.board, piece.color, derivedState);
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
