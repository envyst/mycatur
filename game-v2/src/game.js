import { COLORS, GAME_MODES } from './config.js';
import { PIECE_TYPES } from './pieces.js';
import { createInitialState } from './state.js';
import { getPiece, getLegalMoves, getPseudoLegalMoves, applyMove, isKingInCheck, hasAnyLegalMove, createPositionKey, findKing } from './board.js';
import {
  renderBoard,
  renderBoardBanner,
  renderMoveLog,
  renderStatus,
  bindControls,
  syncControls,
  renderPromotionControls,
  renderAuth,
  renderSessions,
  renderSpecializedSetup,
  renderSandboxControls,
  renderReplayControls,
  getLoginFormValues,
  getNewSessionValues,
} from './ui.js';
import { api } from './api.js';
import { createEngine } from './engine.js';
import { createEmptyAssignments } from './specialized/index.js';
import { collectAdjacentEnemyIdsForIcicles } from './specialized/effects.js';

function sameSquare(a, b) {
  return a && b && a.row === b.row && a.col === b.col;
}

function toChessCoord(row, col) {
  return `${'abcdefgh'[col]}${8 - row}`;
}

function fileLetter(col) {
  return 'abcdefgh'[col];
}

function rankNumber(row) {
  return String(8 - row);
}

function pieceLetter(type) {
  if (type === PIECE_TYPES.KING) return 'K';
  if (type === PIECE_TYPES.QUEEN) return 'Q';
  if (type === PIECE_TYPES.ROOK) return 'R';
  if (type === PIECE_TYPES.BISHOP) return 'B';
  if (type === PIECE_TYPES.KNIGHT) return 'N';
  return '';
}

function getOpponentColor(color) {
  return color === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
}

function cloneBoardState(board) {
  return board.map(row => row.map(piece => (piece ? { ...piece } : null)));
}

function incrementPositionHistory(state) {
  const key = createPositionKey(state.board, state.currentTurn, state.castlingRights, state.enPassantTarget);
  state.positionHistory[key] = (state.positionHistory[key] || 0) + 1;
}

function inferResult(state) {
  if (state.winner === COLORS.WHITE) return 'white-win';
  if (state.winner === COLORS.BLACK) return 'black-win';
  if (state.isDraw) return 'draw';
  return null;
}

function buildPgnText(moveEntries) {
  const chunks = [];
  for (let i = 0; i < moveEntries.length; i += 1) {
    const moveNumber = Math.floor(i / 2) + 1;
    if (i % 2 === 0) {
      const whiteMove = moveEntries[i] || '';
      const blackMove = moveEntries[i + 1] || '';
      chunks.push(`${moveNumber}. ${whiteMove}${blackMove ? ` ${blackMove}` : ''}`);
    }
  }
  return chunks.join(' ');
}

function buildSessionPayload(state, move = null) {
  return {
    name: state.sessionName || null,
    ruleset: state.isSandbox ? 'sandbox' : state.isSpecialized ? 'specialized' : 'normal',
    specializedAssignments: state.specializedAssignments,
    status: state.winner || state.isDraw ? 'finished' : 'active',
    result: inferResult(state),
    currentTurn: state.currentTurn,
    board: state.board,
    castlingRights: state.castlingRights,
    enPassantTarget: state.enPassantTarget,
    halfmoveClock: state.halfmoveClock,
    fullmoveNumber: state.fullmoveNumber,
    positionHistory: state.positionHistory,
    pgnText: buildPgnText(state.moveHistory),
    move,
  };
}

function formatMoveEntry(index, san) {
  const moveNumber = Math.floor(index / 2) + 1;
  return index % 2 === 0 ? `${moveNumber}. ${san}` : `${moveNumber}... ${san}`;
}

function countSameTypeAttackers(board, piece, to, from, gameState) {
  const matches = [];
  board.forEach((rowArr, rowIndex) => {
    rowArr.forEach((candidate, colIndex) => {
      if (!candidate) return;
      if (candidate.color !== piece.color || candidate.type !== piece.type) return;
      if (rowIndex === from.row && colIndex === from.col) return;
      const moves = getLegalMoves(board, rowIndex, colIndex, gameState);
      if (moves.some(move => move.row === to.row && move.col === to.col)) {
        matches.push({ row: rowIndex, col: colIndex });
      }
    });
  });
  return matches;
}

function buildDisambiguation(board, piece, from, to, gameState) {
  if (piece.type === PIECE_TYPES.PAWN || piece.type === PIECE_TYPES.KING) return '';
  const matches = countSameTypeAttackers(board, piece, to, from, gameState);
  if (!matches.length) return '';
  const sameFile = matches.some(match => match.col === from.col);
  const sameRank = matches.some(match => match.row === from.row);
  if (!sameFile) return fileLetter(from.col);
  if (!sameRank) return rankNumber(from.row);
  return `${fileLetter(from.col)}${rankNumber(from.row)}`;
}

function buildSan(piece, from, to, applied, capturedPiece, promotionPiece = null, boardBefore = null, gameState = null, boardAfter = null, nextTurn = null) {
  if (applied.notation === 'castle kingside') return 'O-O';
  if (applied.notation === 'castle queenside') return 'O-O-O';
  const destination = toChessCoord(to.row, to.col);
  const capture = capturedPiece || applied.isCapture;
  const prefix = piece.type === PIECE_TYPES.PAWN ? '' : pieceLetter(piece.type);
  const pawnCapturePrefix = piece.type === PIECE_TYPES.PAWN && capture ? fileLetter(from.col) : '';
  const disambiguation = boardBefore && gameState ? buildDisambiguation(boardBefore, piece, to, from, gameState) : '';
  const separator = capture ? 'x' : '';
  const promotionSuffix = promotionPiece ? `=${pieceLetter(promotionPiece)}` : '';
  if (piece.type === PIECE_TYPES.PAWN) {
    return capture ? `${pawnCapturePrefix}${separator}${destination}${promotionSuffix}` : `${destination}${promotionSuffix}`;
  }
  return `${prefix}${disambiguation}${separator}${destination}${promotionSuffix}`;
}

export function createGame() {
  let state = {
    ...createInitialState({ mode: GAME_MODES.HUMAN_VS_HUMAN, playerColor: COLORS.WHITE }),
    validMoves: [],
    checkColor: null,
    statusMessage: '',
    isDraw: false,
    user: null,
    sessions: [],
    sessionId: null,
    readOnly: false,
    moveHistory: [],
    pendingPromotionMove: null,
    lastMove: null,
    replayStates: [],
    replayIndex: 0,
    replayBoard: null,
    engine: createEngine(),
    aiThinking: false,
    isSpecialized: false,
    isSandbox: false,
    sandboxPendingSummon: null,
  };

  function updateRulesetState(ruleset) {
    state.isSpecialized = ruleset === 'specialized';
    state.isSandbox = ruleset === 'sandbox';
  }

  function applySpecializationsToBoard() {
    if (!state.isSpecialized) return;
    const assignments = [...(state.specializedAssignments.white || []), ...(state.specializedAssignments.black || [])].filter(Boolean);
    assignments.forEach(assignment => {
      for (let row = 0; row < state.board.length; row += 1) {
        for (let col = 0; col < state.board[row].length; col += 1) {
          const piece = state.board[row][col];
          if (!piece) continue;
          if (piece.id?.endsWith(`-${assignment.square}`)) {
            state.board[row][col] = { ...piece, specialization: assignment.specialization };
          }
        }
      }
    });
  }

  function pushSandboxHistorySnapshot() {
    state.sandboxHistory = state.sandboxHistory || [];
    state.sandboxHistory.push({
      board: cloneBoardState(state.board),
      castlingRights: JSON.parse(JSON.stringify(state.castlingRights)),
      enPassantTarget: state.enPassantTarget ? { ...state.enPassantTarget } : null,
      currentTurn: state.currentTurn,
      pendingPromotion: state.pendingPromotion ? { ...state.pendingPromotion } : null,
      moveHistory: [...state.moveHistory],
      moveLog: [...state.moveLog],
      lastMove: state.lastMove ? { from: { ...state.lastMove.from }, to: { ...state.lastMove.to } } : null,
    });
    if (state.sandboxHistory.length > 100) state.sandboxHistory.shift();
  }

  function undoSandboxAction() {
    if (!state.isSandbox || !state.sandboxHistory?.length) return false;
    const prev = state.sandboxHistory.pop();
    if (!prev) return false;
    state.board = cloneBoardState(prev.board);
    state.castlingRights = JSON.parse(JSON.stringify(prev.castlingRights));
    state.enPassantTarget = prev.enPassantTarget ? { ...prev.enPassantTarget } : null;
    state.currentTurn = prev.currentTurn;
    state.pendingPromotion = prev.pendingPromotion ? { ...prev.pendingPromotion } : null;
    state.moveHistory = [...prev.moveHistory];
    state.moveLog = [...prev.moveLog];
    state.lastMove = prev.lastMove ? { from: { ...prev.lastMove.from }, to: { ...prev.lastMove.to } } : null;
    state.selectedSquare = null;
    state.validMoves = [];
    state.statusMessage = 'Sandbox undo applied.';
    redraw();
    return true;
  }

  function sandboxMovePiece(fromRow, fromCol, toRow, toCol) {
    const piece = state.board[fromRow][fromCol];
    if (!piece) return false;
    pushSandboxHistorySnapshot();
    state.board[toRow][toCol] = piece;
    state.board[fromRow][fromCol] = null;
    state.selectedSquare = null;
    state.validMoves = [];
    state.pendingPromotion = null;
    state.enPassantTarget = null;
    state.lastMove = { from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } };
    state.lastMovedPieceIdByColor = { ...(state.lastMovedPieceIdByColor || { white: null, black: null }), [piece.color]: piece.id || null };
    state.currentTurn = getOpponentColor(piece.color);
    state.statusMessage = `Sandbox moved ${piece.color} ${piece.type} to ${toChessCoord(toRow, toCol)}.`;
    updateGameStatus();
    redraw();
    return true;
  }

  function sandboxDeletePiece(row, col) {
    const piece = state.board[row][col];
    if (!piece) return false;
    pushSandboxHistorySnapshot();
    state.board[row][col] = null;
    state.selectedSquare = null;
    state.validMoves = [];
    state.pendingPromotion = null;
    state.enPassantTarget = null;
    state.statusMessage = `Deleted ${piece.color} ${piece.type} from ${toChessCoord(row, col)}.`;
    redraw();
    return true;
  }

  function makeSandboxPiece(color, type, row, col) {
    return {
      id: `sandbox-${color}-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      color,
      type,
      specialization: null,
    };
  }

  function sandboxSummonPiece(row, col, color, type) {
    pushSandboxHistorySnapshot();
    state.board[row][col] = makeSandboxPiece(color, type, row, col);
    state.selectedSquare = null;
    state.validMoves = [];
    state.pendingPromotion = null;
    state.enPassantTarget = null;
    state.lastMove = null;
    state.statusMessage = `Summoned ${color} ${type} on ${toChessCoord(row, col)}.`;
    redraw();
    return true;
  }


  function sandboxApplyCustomMarker(textValue) {
    if (!state.selectedSquare) return false;
    const piece = getPiece(state.board, state.selectedSquare.row, state.selectedSquare.col);
    if (!piece) return false;
    pushSandboxHistorySnapshot();
    state.board[state.selectedSquare.row][state.selectedSquare.col] = {
      ...piece,
      customMarker: (textValue || '').trim(),
    };
    state.statusMessage = `Applied marker to ${piece.color} ${piece.type}.`;
    redraw();
    return true;
  }

  function sandboxClearCustomMarker() {
    if (!state.selectedSquare) return false;
    const piece = getPiece(state.board, state.selectedSquare.row, state.selectedSquare.col);
    if (!piece) return false;
    pushSandboxHistorySnapshot();
    const nextPiece = { ...piece };
    delete nextPiece.customMarker;
    state.board[state.selectedSquare.row][state.selectedSquare.col] = nextPiece;
    state.statusMessage = `Cleared marker from ${piece.color} ${piece.type}.`;
    redraw();
    return true;
  }



  function resolveBlueprintTransformations() {
    if (!state.isSpecialized) return;
    for (let row = 0; row < state.board.length; row += 1) {
      for (let col = 0; col < state.board[row].length; col += 1) {
        const piece = state.board[row][col];
        if (!piece || piece.specialization !== 'Blueprint') continue;
        const leftPiece = col > 0 ? state.board[row][col - 1] : null;
        const copiedSpecialization = leftPiece?.specialization || null;
        if (copiedSpecialization) {
          state.board[row][col] = { ...piece, specialization: copiedSpecialization };
        } else {
          state.board[row][col] = { ...piece, specialization: null };
        }
      }
    }
  }


  function resolveBladeRunnerPendingKillsForColor(color) {
    const pending = state.bladeRunnerPendingKillsByColor?.[color] || [];
    if (!pending.length) return 0;
    let removed = 0;
    const pendingIds = new Set(pending);
    for (let row = 0; row < state.board.length; row += 1) {
      for (let col = 0; col < state.board[row].length; col += 1) {
        const piece = state.board[row][col];
        if (piece?.id && pendingIds.has(piece.id)) {
          if (piece.hordeFamilyId) {
            removed += removeHordeFamily(piece.hordeFamilyId);
          } else {
            state.board[row][col] = null;
            removed += 1;
          }
        }
      }
    }
    state.bladeRunnerPendingKillsByColor = {
      ...(state.bladeRunnerPendingKillsByColor || {}),
      [color]: [],
    };
    return removed;
  }

  function updateIcicleFreezeState() {
    if (!state.isSpecialized) return;
    const adjacentIds = collectAdjacentEnemyIdsForIcicles(state.board);
    const next = { ...(state.specializedStatusById || {}) };

    Object.keys(next).forEach(id => {
      if (!adjacentIds.has(id)) {
        if (next[id]?.frozen) {
          next[id] = { ...next[id], pendingFreeze: false };
        } else {
          delete next[id];
        }
      }
    });

    adjacentIds.forEach(id => {
      const prev = next[id] || { frozen: false, pendingFreeze: false, pendingFromTurn: null };
      if (prev.frozen) {
        next[id] = prev;
        return;
      }
      if (!prev.pendingFreeze) {
        next[id] = {
          ...prev,
          pendingFreeze: true,
          pendingFromTurn: state.currentTurn,
        };
        return;
      }
      if (prev.pendingFromTurn !== state.currentTurn) {
        next[id] = {
          ...prev,
          frozen: true,
          pendingFreeze: false,
        };
        return;
      }
      next[id] = prev;
    });

    state.specializedStatusById = next;
  }

  function spendTurnToUnfreeze(piece) {
    if (!piece?.id) return false;
    const status = state.specializedStatusById?.[piece.id];
    if (!status?.frozen) return false;
    state.specializedStatusById = {
      ...(state.specializedStatusById || {}),
      [piece.id]: { pendingFreeze: false, pendingFromTurn: null, frozen: false },
    };
    state.currentTurn = getOpponentColor(piece.color);
    clearSelection();
    state.statusMessage = `${piece.color} ${piece.type} spent a turn to unfreeze.`;
    updateGameStatus();
    redraw();
    return true;
  }


  function pieceThreatensSquare(piece, fromRow, fromCol, targetRow, targetCol) {
    const moves = getPseudoLegalMoves(state.board, fromRow, fromCol, state);
    return moves.some(move => move.row === targetRow && move.col === targetCol);
  }

  function updateGunslingerThreatState() {
    if (!state.isSpecialized) return;
    const next = {};

    for (let row = 0; row < state.board.length; row += 1) {
      for (let col = 0; col < state.board[row].length; col += 1) {
        const piece = state.board[row][col];
        if (!piece || piece.specialization !== 'Gunslinger' || !piece.id) continue;
        const prev = state.gunslingerStateById?.[piece.id] || { targets: {} };
        const nextTargets = {};

        for (let r = 0; r < state.board.length; r += 1) {
          for (let c = 0; c < state.board[r].length; c += 1) {
            const other = state.board[r][c];
            if (!other || other.color === piece.color || other.type === 'king' || !other.id) continue;
            const threatens = pieceThreatensSquare(piece, row, col, r, c);
            const threatenedBack = pieceThreatensSquare(other, r, c, row, col);
            if (!threatens || !threatenedBack) continue;
            const prevTarget = prev.targets?.[other.id] || { armed: false, pending: false };
            nextTargets[other.id] = {
              armed: prevTarget.armed || prevTarget.pending,
              pending: !prevTarget.armed && !prevTarget.pending,
            };
          }
        }

        next[piece.id] = { targets: nextTargets };
      }
    }

    state.gunslingerStateById = next;
  }

  function tryTriggerGunslingerAction(piece, row, col) {
    if (!piece?.id || piece.specialization !== 'Gunslinger') return false;
    const gs = state.gunslingerStateById?.[piece.id];
    const armedTargetIds = Object.entries(gs?.targets || {})
      .filter(([, info]) => info?.armed)
      .map(([targetId]) => targetId);
    if (!armedTargetIds.length) return false;

    pushSandboxHistorySnapshot?.();
    let destroyedCount = 0;
    for (let r = 0; r < state.board.length; r += 1) {
      for (let c = 0; c < state.board[r].length; c += 1) {
        const other = state.board[r][c];
        if (other?.id && armedTargetIds.includes(other.id)) {
          state.board[r][c] = null;
          destroyedCount += 1;
        }
      }
    }

    state.currentTurn = getOpponentColor(piece.color);
    state.statusMessage = `Gunslinger destroyed ${destroyedCount} target${destroyedCount === 1 ? '' : 's'}.`;
    state.gunslingerStateById = { ...(state.gunslingerStateById || {}), [piece.id]: { targets: {} } };
    clearSelection();
    updateGameStatus();
    redraw();
    return true;
  }


  function getNonCapturingBishopMoves(board, row, col) {
    const moves = [];
    const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (const [dr, dc] of dirs) {
      let r = row + dr;
      let c = col + dc;
      while (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const target = board[r][c];
        if (target) break;
        moves.push({ row: r, col: c });
        r += dr;
        c += dc;
      }
    }
    return moves;
  }



  function getRandomEmptySquare() {
    const empties = [];
    for (let row = 0; row < state.board.length; row += 1) {
      for (let col = 0; col < state.board[row].length; col += 1) {
        if (!state.board[row][col]) empties.push({ row, col });
      }
    }
    if (!empties.length) return null;
    return empties[Math.floor(Math.random() * empties.length)] || null;
  }

  async function tryRocketmanBlastOff(piece, row, col) {
    if (!piece?.id || piece.specialization !== 'Rocketman') return false;
    if (state.rocketmanUsedById?.[piece.id]) {
      state.statusMessage = 'Rocketman blast-off already used.';
      redraw();
      return true;
    }
    const target = getRandomEmptySquare();
    if (!target) {
      state.statusMessage = 'No empty square available for Rocketman blast-off.';
      redraw();
      return true;
    }
    state.board[target.row][target.col] = piece;
    state.board[row][col] = null;
    state.rocketmanUsedById = {
      ...(state.rocketmanUsedById || {}),
      [piece.id]: true,
    };
    state.lastMove = { from: { row, col }, to: { row: target.row, col: target.col } };
    state.currentTurn = getOpponentColor(piece.color);
    clearSelection();
    state.statusMessage = `${piece.color} Rocketman blasted off to ${toChessCoord(target.row, target.col)}.`;
    updateGameStatus();
    redraw();
    maybeDoEngineMove();
    return true;
  }

  function tryDissipateDjinn(piece, row, col) {
    if (!piece?.id || piece.specialization !== 'Djinn') return false;
    state.board[row][col] = null;
    state.djinnStateById = {
      ...(state.djinnStateById || {}),
      [piece.id]: {
        piece: { ...piece },
        returnRow: row,
        returnCol: col,
        dissipated: true,
      },
    };
    state.currentTurn = getOpponentColor(piece.color);
    clearSelection();
    state.statusMessage = `${piece.color} Djinn dissipated and will return on the next capture.`;
    updateGameStatus();
    redraw();
    return true;
  }

  function resolveDjinnReturnsOnCapture() {
    const entries = Object.entries(state.djinnStateById || {}).filter(([, info]) => info?.dissipated && info?.piece);
    if (!entries.length) return false;
    for (const [id, info] of entries) {
      state.board[info.returnRow][info.returnCol] = { ...info.piece };
      state.djinnStateById = {
        ...(state.djinnStateById || {}),
        [id]: { ...info, dissipated: false },
      };
    }
    return true;
  }

  function computeDancerSpecialDestinations(row, col) {
    const piece = getPiece(state.board, row, col);
    if (!piece || piece.specialization !== 'Dancer') return [];
    const destinations = new Map();

    // one-step non-capturing bishop move
    for (const move of getNonCapturingBishopMoves(state.board, row, col)) {
      if (!(move.row === row && move.col === col)) {
        destinations.set(`${move.row}:${move.col}`, move);
      }
    }

    // two-step non-capturing bishop move
    for (const first of getNonCapturingBishopMoves(state.board, row, col)) {
      const boardAfterFirst = cloneBoardState(state.board);
      boardAfterFirst[first.row][first.col] = boardAfterFirst[row][col];
      boardAfterFirst[row][col] = null;
      for (const second of getNonCapturingBishopMoves(boardAfterFirst, first.row, first.col)) {
        if (!(second.row === row && second.col === col)) {
          destinations.set(`${second.row}:${second.col}`, second);
        }
      }
    }

    return [...destinations.values()];
  }

  function enterDancerSpecialMode(piece) {
    if (!piece?.id) return false;
    const dancerState = state.dancerStateById?.[piece.id];
    if (!dancerState?.armed) return false;
    const pos = findPieceById(piece.id);
    if (!pos) return false;
    state.activeDancerSpecialPieceId = piece.id;
    state.selectedSquare = { row: pos.row, col: pos.col };
    state.validMoves = computeDancerSpecialDestinations(pos.row, pos.col);
    state.statusMessage = `${piece.color} Dancer special mode active. Choose a final destination (up to 2 non-capturing bishop moves).`;
    redraw();
    return true;
  }

  function findPieceById(id) {
    for (let row = 0; row < state.board.length; row += 1) {
      for (let col = 0; col < state.board[row].length; col += 1) {
        const piece = state.board[row][col];
        if (piece?.id === id) return { row, col, piece };
      }
    }
    return null;
  }

  function normalizeAssignmentSlots(assignments) {
    return {
      white: (assignments.white && assignments.white.length ? assignments.white : [null]).map(item => item || null),
      black: (assignments.black && assignments.black.length ? assignments.black : [null]).map(item => item || null),
    };
  }






  function removeHordeFamily(familyId) {
    if (!familyId) return 0;
    let removed = 0;
    for (let row = 0; row < state.board.length; row += 1) {
      for (let col = 0; col < state.board[row].length; col += 1) {
        const piece = state.board[row][col];
        if (piece?.hordeFamilyId === familyId) {
          state.board[row][col] = null;
          removed += 1;
        }
      }
    }
    return removed;
  }

  function createHordeling(color, familyId) {
    return {
      id: `hordeling-${color}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      color,
      type: PIECE_TYPES.PAWN,
      specialization: null,
      customMarker: 'H',
      hordeFamilyId: familyId,
      isHordeling: true,
      noPromotion: true,
    };
  }

  async function handlePendingHordeSpawn(row, col) {
    if (!state.pendingHordeSpawn) return false;
    if (state.board[row][col]) {
      state.statusMessage = 'Choose an empty square for the hordeling.';
      setPendingHordePlacementTargets();
      redraw();
      return true;
    }
    state.board[row][col] = createHordeling(state.pendingHordeSpawn.color, state.pendingHordeSpawn.familyId);
    state.pendingHordeSpawn = null;
    state.replayStates = [...(state.replayStates || []), { board: cloneBoardState(state.board), currentTurn: getOpponentColor(state.currentTurn), result: null, status: 'active' }];
    state.replayIndex = state.replayStates.length - 1;
    state.replayBoard = null;
    await finalizeTurn();
    redraw();
    maybeDoEngineMove();
    return true;
  }

  function spawnPilgrimBishops(color, from, count) {
    if (!count) return 0;
    if (state.board[from.row]?.[from.col]) return 0;
    let spawned = 0;
    state.board[from.row][from.col] = {
      id: `pilgrim-spawn-${color}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      color,
      type: PIECE_TYPES.BISHOP,
      specialization: null,
    };
    spawned = 1;
    return spawned;
  }

  function triggerElectroknightDischarge(piece, landingRow, landingCol) {
    if (!piece?.id) return 0;
    const candidates = [];
    for (let r = Math.max(0, landingRow - 1); r <= Math.min(7, landingRow + 1); r += 1) {
      for (let c = Math.max(0, landingCol - 1); c <= Math.min(7, landingCol + 1); c += 1) {
        if (r === landingRow && c === landingCol) continue;
        const target = state.board[r][c];
        if (!target || target.color === piece.color) continue;
        candidates.push({ row: r, col: c, id: target.id });
      }
    }
    state.electroknightStateById = {
      ...(state.electroknightStateById || {}),
      [piece.id]: {
        consecutiveOwnMoves: 0,
        charged: false,
      },
    };
    if (!candidates.length) return 0;
    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    state.board[selected.row][selected.col] = null;
    return 1;
  }

  function triggerFissionReactorExplosion(pieceId, color) {
    const pos = findPieceById(pieceId);
    if (!pos) return 0;
    let destroyed = 0;

    state.board[pos.row][pos.col] = null;
    destroyed += 1;

    for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
      const r = pos.row + dr;
      const c = pos.col + dc;
      if (r < 0 || r >= 8 || c < 0 || c >= 8) continue;
      const target = state.board[r][c];
      if (target && target.color !== color) {
        state.board[r][c] = null;
        destroyed += 1;
      }
    }

    return destroyed;
  }

  function transformFirstAlliedPawnToGolden(color) {
    for (let row = 0; row < state.board.length; row += 1) {
      for (let col = 0; col < state.board[row].length; col += 1) {
        const piece = state.board[row][col];
        if (!piece || piece.color !== color || piece.type !== PIECE_TYPES.PAWN) continue;
        if (piece.specialization === 'Golden Pawn') continue;
        state.board[row][col] = { ...piece, specialization: 'Golden Pawn' };
        return { row, col, piece: state.board[row][col] };
      }
    }
    return null;
  }

  function updateGameStatus() {
    const whiteKing = findKing(state.board, COLORS.WHITE);
    const blackKing = findKing(state.board, COLORS.BLACK);
    if (!whiteKing && blackKing) {
      state.winner = COLORS.BLACK;
      state.isDraw = false;
      state.checkColor = null;
      state.statusMessage = 'White king is gone.';
      return;
    }
    if (!blackKing && whiteKing) {
      state.winner = COLORS.WHITE;
      state.isDraw = false;
      state.checkColor = null;
      state.statusMessage = 'Black king is gone.';
      return;
    }
    if (state.isSandbox) {
      const sideToMove = state.currentTurn;
      const inCheck = isKingInCheck(state.board, sideToMove, state);
      const hasMove = hasAnyLegalMove(state.board, sideToMove, state);
      const currentPositionKey = createPositionKey(state.board, state.currentTurn, state.castlingRights, state.enPassantTarget);
      state.checkColor = inCheck ? sideToMove : null;
      state.winner = null;
      state.isDraw = false;
      if (inCheck && !hasMove) {
        state.winner = getOpponentColor(sideToMove);
        state.statusMessage = `${sideToMove} is checkmated.`;
        return;
      }
      if (!inCheck && !hasMove) {
        state.isDraw = true;
        state.statusMessage = 'Draw by stalemate.';
        return;
      }
      if (state.positionHistory[currentPositionKey] >= 3) {
        state.isDraw = true;
        state.statusMessage = 'Draw by threefold repetition.';
        return;
      }
      if (inCheck) {
        state.statusMessage = `${sideToMove} is in check.`;
      } else if (!state.statusMessage) {
        state.statusMessage = 'Sandbox mode active.';
      }
      return;
    }
    const sideToMove = state.currentTurn;
    const inCheck = isKingInCheck(state.board, sideToMove, state);
    const hasMove = hasAnyLegalMove(state.board, sideToMove, state);
    const currentPositionKey = createPositionKey(state.board, state.currentTurn, state.castlingRights, state.enPassantTarget);
    state.checkColor = inCheck ? sideToMove : null;
    state.statusMessage = '';
    state.winner = null;
    state.isDraw = false;
    if (inCheck && !hasMove) {
      state.winner = getOpponentColor(sideToMove);
      state.statusMessage = `${sideToMove} is checkmated.`;
      return;
    }
    if (!inCheck && !hasMove) {
      state.isDraw = true;
      state.statusMessage = 'Draw by stalemate.';
      return;
    }
    if (state.positionHistory[currentPositionKey] >= 3) {
      state.isDraw = true;
      state.statusMessage = 'Draw by threefold repetition.';
      return;
    }
    if (inCheck) state.statusMessage = `${sideToMove} is in check.`;
  }

  function scrollActiveReplayMoveIntoView() {
    const active = document.querySelector('[data-active-replay-move="true"]');
    if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function redraw() {
    renderBoard(state, handleSquareClick);
    renderBoardBanner(state);
    renderStatus(state);
    renderMoveLog(state, jumpToReplayIndex);
    renderPromotionControls(state, handlePromotion);
    renderAuth(state.user);
    renderSessions(state.sessions, loadSession, handleDeleteSession, handleRenameSession);
    renderSpecializedSetup(state, handleSpecializedAssignment, handleSpecializedSetupSideChange, handleAddSpecializedAssignmentRow);
    renderSandboxControls(state, {
      onSandboxSummon: handleSandboxSummon,
      onSandboxDelete: handleSandboxDelete,
      onSandboxUndo: handleSandboxUndo,
      onSandboxAskAi: handleSandboxAskAi,
      onSandboxApplyMarker: handleSandboxApplyMarker,
      onSandboxClearMarker: handleSandboxClearMarker,
    });
    renderReplayControls(state);
    syncControls(state);
    if (state.replayBoard) setTimeout(scrollActiveReplayMoveIntoView, 0);
  }

  function jumpToReplayIndex(index) {
    if (!state.replayStates.length) return;
    state.replayIndex = Math.max(0, Math.min(index, state.replayStates.length - 1));
    const snapshot = state.replayStates[state.replayIndex];
    state.replayBoard = state.replayIndex === state.replayStates.length - 1 ? null : snapshot.board;
    if (snapshot?.currentTurn) {
      state.currentTurn = snapshot.currentTurn;
    }
    redraw();
  }

  async function refreshSessions() {
    if (!state.user) {
      state.sessions = [];
      redraw();
      return;
    }
    const data = await api.listSessions();
    state.sessions = data.sessions || [];
    redraw();
  }

  function setSelection(row, col) {
    state.selectedSquare = { row, col };
    state.validMoves = state.isSandbox ? [] : getLegalMoves(state.board, row, col, state);
  }

  function clearSelection() {
    state.selectedSquare = null;
    state.validMoves = [];
  }

  function setPendingHordePlacementTargets() {
    state.selectedSquare = null;
    state.validMoves = [];
    for (let row = 0; row < state.board.length; row += 1) {
      for (let col = 0; col < state.board[row].length; col += 1) {
        if (!state.board[row][col]) {
          state.validMoves.push({ row, col });
        }
      }
    }
  }

  async function persistState(move = null) {
    if (!state.sessionId || state.readOnly) return;
    await api.updateSession(state.sessionId, buildSessionPayload(state, move));
    await refreshSessions();
  }

  async function finalizeTurn(move = null) {
    state.currentTurn = getOpponentColor(state.currentTurn);
    const bladeRunnerRemoved = resolveBladeRunnerPendingKillsForColor(state.currentTurn);
    if (bladeRunnerRemoved) {
      state.statusMessage = `${state.currentTurn} Blade Runner delayed kill removed ${bladeRunnerRemoved} piece${bladeRunnerRemoved === 1 ? '' : 's'}.`;
    }
    state.activeDancerSpecialPieceId = null;
    incrementPositionHistory(state);
    clearSelection();
    updateIcicleFreezeState();
    updateGunslingerThreatState();
    updateGameStatus();
    await persistState(move);
  }

  async function handlePromotion(pieceType) {
    if (!state.pendingPromotion || state.readOnly || !state.pendingPromotionMove) return;
    const { row, col } = state.pendingPromotion;
    const piece = state.board[row][col];
    if (!piece || piece.type !== PIECE_TYPES.PAWN) return;

    const from = state.pendingPromotionMove.from;
    const to = state.pendingPromotionMove.to;
    const moveIndex = state.moveHistory.length - 1;
    const applied = state.pendingPromotionMove.applied;
    const capturedPiece = state.pendingPromotionMove.capturedPiece;
    const boardBefore = state.pendingPromotionMove.boardBefore;
    const gameStateBefore = state.pendingPromotionMove.gameStateBefore;

    state.board[row][col] = { ...piece, type: pieceType };
    const nextTurn = getOpponentColor(piece.color);
    const san = buildSan(
      { ...piece, type: PIECE_TYPES.PAWN },
      from,
      to,
      applied,
      capturedPiece,
      pieceType,
      boardBefore,
      gameStateBefore,
      state.board,
      nextTurn,
    );

    state.moveHistory[moveIndex] = san;
    state.moveLog[moveIndex] = formatMoveEntry(moveIndex, san);

    state.pendingPromotion = null;
    state.pendingPromotionMove = null;
    state.replayStates = [...(state.replayStates || []), { board: cloneBoardState(state.board), currentTurn: nextTurn, result: null, status: 'active' }];
    state.replayIndex = state.replayStates.length - 1;
    state.replayBoard = null;
    await finalizeTurn({
      moveIndex: moveIndex + 1,
      side: piece.color,
      fromSquare: toChessCoord(from.row, from.col),
      toSquare: toChessCoord(to.row, to.col),
      piece: 'pawn',
      promotionPiece: pieceType,
      san,
    });
    redraw();
    maybeDoEngineMove();
  }

  async function makeMove(from, to) {
    const boardBefore = cloneBoardState(state.board);
    const piece = getPiece(state.board, from.row, from.col);
    const capturedPiece = getPiece(state.board, to.row, to.col);
    const capturedFamilyId = capturedPiece?.hordeFamilyId || null;
    const applied = applyMove(state.board, from.row, from.col, to.row, to.col, state);
    state.board = applied.board;
    state.castlingRights = applied.castlingRights;
    state.enPassantTarget = applied.enPassantTarget;
    if (capturedFamilyId) {
      removeHordeFamily(capturedFamilyId);
    }
    const movedRules = piece?.specialization ? { specialization: piece.specialization } : null;
    if (piece?.id && piece.specialization === 'Marauder' && applied.isCapture) {
      state.specializedCaptureCountsById = {
        ...(state.specializedCaptureCountsById || {}),
        [piece.id]: (state.specializedCaptureCountsById?.[piece.id] || 0) + 1,
      };
    }
    if (piece?.id && piece.specialization === 'Pilgrim') {
      const distance = Math.max(Math.abs(to.row - from.row), Math.abs(to.col - from.col));
      const prevTravel = state.pilgrimTravelById?.[piece.id] || 0;
      const nextTravel = prevTravel + distance;
      const spawnCount = Math.floor(nextTravel / 20);
      const remainingTravel = nextTravel % 20;
      if (spawnCount > 0) {
        const spawned = spawnPilgrimBishops(piece.color, from, spawnCount);
        state.statusMessage = `${piece.color} Pilgrim resurrected ${spawned} bishop${spawned === 1 ? '' : 's'}.`;
      }
      state.pilgrimTravelById = {
        ...(state.pilgrimTravelById || {}),
        [piece.id]: remainingTravel,
      };
    }
    if (piece?.specialization === 'Electroknight' && piece.id) {
      const prev = state.electroknightStateById?.[piece.id] || { consecutiveOwnMoves: 0, charged: false };
      const nextCount = prev.charged ? prev.consecutiveOwnMoves : (prev.consecutiveOwnMoves || 0) + 1;
      const nextCharged = prev.charged || nextCount >= 3;
      state.electroknightStateById = {
        ...(state.electroknightStateById || {}),
        [piece.id]: {
          consecutiveOwnMoves: nextCount,
          charged: nextCharged,
        },
      };
      if (nextCharged && applied.isCapture) {
        const chainedKills = triggerElectroknightDischarge(piece, to.row, to.col);
        state.statusMessage = `${piece.color} Electroknight discharged${chainedKills ? ` and electrocuted ${chainedKills} adjacent enemy.` : '.'}`;
      }
    } else if (piece?.color) {
      const nextEkState = { ...(state.electroknightStateById || {}) };
      Object.entries(nextEkState).forEach(([id, info]) => {
        const ekPos = findPieceById(id);
        if (!ekPos || ekPos.piece?.color !== piece.color) return;
        nextEkState[id] = { ...(info || {}), consecutiveOwnMoves: 0, charged: false };
      });
      state.electroknightStateById = nextEkState;
    }
    if (piece?.specialization === 'Banker' && capturedPiece?.type === PIECE_TYPES.PAWN) {
      const transformed = transformFirstAlliedPawnToGolden(piece.color);
      if (transformed) {
        state.statusMessage = `${piece.color} Banker transformed an allied pawn into a Golden Pawn.`;
      }
    }
    if (piece?.specialization === 'Horde Mother' && applied.isCapture) {
      const familyId = piece.hordeFamilyId || `horde-${piece.id}`;
      state.board[to.row][to.col] = { ...state.board[to.row][to.col], hordeFamilyId: familyId };
      state.pendingHordeSpawn = {
        familyId,
        color: piece.color,
        motherId: piece.id,
      };
      state.statusMessage = `${piece.color} Horde Mother captured. Choose an empty square for the hordeling.`;
      setPendingHordePlacementTargets();
      redraw();
      return;
    }
    if (piece?.id && piece.specialization === 'Fission Reactor' && applied.isCapture) {
      const nextCount = (state.specializedCaptureCountsById?.[piece.id] || 0) + 1;
      state.specializedCaptureCountsById = {
        ...(state.specializedCaptureCountsById || {}),
        [piece.id]: nextCount,
      };
      if (nextCount >= 5) {
        const destroyed = triggerFissionReactorExplosion(piece.id, piece.color);
        state.statusMessage = `${piece.color} Fission Reactor exploded and destroyed ${destroyed} piece${destroyed === 1 ? '' : 's'}.`;
      }
    }
    const nextTurn = getOpponentColor(piece.color);
    const bladeRunnerPassedEnemyIds = state.validMoves.find(move => move.row === to.row && move.col === to.col)?.bladeRunnerPassedEnemyIds || [];
    if (piece?.specialization === 'Blade Runner' && bladeRunnerPassedEnemyIds.length) {
      const prevPending = state.bladeRunnerPendingKillsByColor?.[piece.color] || [];
      state.bladeRunnerPendingKillsByColor = {
        ...(state.bladeRunnerPendingKillsByColor || {}),
        [piece.color]: [...new Set([...prevPending, ...bladeRunnerPassedEnemyIds])],
      };
      state.statusMessage = `${piece.color} Blade Runner marked ${bladeRunnerPassedEnemyIds.length} piece${bladeRunnerPassedEnemyIds.length === 1 ? '' : 's'} for delayed death.`;
    }
    const provisionalSan = buildSan(piece, from, to, applied, capturedPiece, null, boardBefore, state, state.board, nextTurn);
    if (applied.isCapture) {
      resolveDjinnReturnsOnCapture();
    }
    state.lastMove = { from, to };
    state.lastMovedPieceIdByColor = { ...(state.lastMovedPieceIdByColor || { white: null, black: null }), [piece.color]: piece.id || null };
    if (piece.specialization === 'Dancer') {
      const enemyColor = getOpponentColor(piece.color);
      const wasUsingSpecialMove = state.activeDancerSpecialPieceId === piece.id;
      if (isKingInCheck(state.board, enemyColor, state)) {
        state.dancerStateById = { ...(state.dancerStateById || {}), [piece.id]: { armed: true, color: piece.color } };
      } else if (!wasUsingSpecialMove && state.dancerStateById?.[piece.id]?.armed) {
        state.dancerStateById = { ...(state.dancerStateById || {}), [piece.id]: { armed: false, color: piece.color } };
      }
    } else if (Object.keys(state.dancerStateById || {}).length) {
      const sameSideArmedEntries = Object.entries(state.dancerStateById || {}).filter(([, info]) => info?.armed && info?.color === piece.color);
      if (sameSideArmedEntries.length) {
        state.dancerStateById = Object.fromEntries(
          Object.entries(state.dancerStateById || {}).map(([id, info]) => {
            if (info?.armed && info?.color === piece.color) {
              return [id, { ...info, armed: false }];
            }
            return [id, info];
          })
        );
        state.activeDancerSpecialPieceId = null;
      }
    }
    state.moveHistory = [...state.moveHistory, provisionalSan];
    state.moveLog = [...state.moveLog, formatMoveEntry(state.moveHistory.length - 1, provisionalSan)];
    if (applied.promotion) {
      state.pendingPromotion = applied.promotion;
      state.pendingPromotionMove = {
        from,
        to,
        applied,
        capturedPiece,
        boardBefore,
        gameStateBefore: {
          board: boardBefore,
          currentTurn: piece.color,
          castlingRights: structuredClone ? structuredClone(state.castlingRights) : JSON.parse(JSON.stringify(state.castlingRights)),
          enPassantTarget: state.enPassantTarget ? { ...state.enPassantTarget } : null,
          positionHistory: { ...state.positionHistory },
        },
      };
      clearSelection();
      redraw();
      return;
    }
    state.replayStates = [...(state.replayStates || []), { board: cloneBoardState(state.board), currentTurn: nextTurn, result: null, status: 'active' }];
    state.replayIndex = state.replayStates.length - 1;
    state.replayBoard = null;
    await finalizeTurn();
  }

  function isSandboxBoardValidForAi() {
    return Boolean(findKing(state.board, COLORS.WHITE) && findKing(state.board, COLORS.BLACK));
  }

  async function handleSandboxAskAi(requestedSide) {
    if (!state.isSandbox || state.mode !== 'human-vs-ai' || state.readOnly || state.replayBoard) return;
    if (!isSandboxBoardValidForAi()) {
      state.statusMessage = 'Sandbox AI requires both kings on the board.';
      redraw();
      return;
    }
    try {
      state.aiThinking = true;
      state.statusMessage = 'Sandbox AI is thinking...';
      redraw();
      const best = await state.engine.getBestMove(state, { depth: 12 });
      state.aiThinking = false;
      if (!best) {
        state.statusMessage = 'Sandbox AI could not find a move.';
        redraw();
        return;
      }
      pushSandboxHistorySnapshot();
      const piece = getPiece(state.board, best.from.row, best.from.col);
      const applied = applyMove(state.board, best.from.row, best.from.col, best.to.row, best.to.col, state);
      state.board = applied.board;
      state.castlingRights = applied.castlingRights;
      state.enPassantTarget = applied.enPassantTarget;
      state.pendingPromotion = null;
      state.lastMove = { from: best.from, to: best.to };
      state.lastMovedPieceIdByColor = { ...(state.lastMovedPieceIdByColor || { white: null, black: null }), [requestedSide]: piece?.id || null };
      state.currentTurn = getOpponentColor(requestedSide);
      state.statusMessage = `Sandbox AI (${requestedSide}) moved ${piece?.type || 'piece'} to ${toChessCoord(best.to.row, best.to.col)}.`;
      redraw();
    } catch (error) {
      state.aiThinking = false;
      state.statusMessage = 'Sandbox AI move failed.';
      redraw();
      console.error(error);
    }
  }

  function handleSandboxDelete() {
    if (!state.isSandbox || !state.selectedSquare) {
      state.statusMessage = 'Select a square first to delete.';
      redraw();
      return;
    }
    sandboxDeletePiece(state.selectedSquare.row, state.selectedSquare.col);
  }

  function handleSandboxApplyMarker(textValue) {
    if (!state.isSandbox) return;
    if (!state.selectedSquare) {
      state.statusMessage = 'Select a piece first to apply a marker.';
      redraw();
      return;
    }
    if (!sandboxApplyCustomMarker(textValue)) {
      state.statusMessage = 'Select a piece first to apply a marker.';
      redraw();
    }
  }

  function handleSandboxClearMarker() {
    if (!state.isSandbox) return;
    if (!state.selectedSquare) {
      state.statusMessage = 'Select a piece first to clear a marker.';
      redraw();
      return;
    }
    if (!sandboxClearCustomMarker()) {
      state.statusMessage = 'Select a piece first to clear a marker.';
      redraw();
    }
  }

  function handleSandboxUndo() {
    if (!undoSandboxAction()) {
      state.statusMessage = 'Nothing to undo.';
      redraw();
    }
  }

  function handleSandboxSummon(color, type) {
    if (!state.isSandbox || !state.selectedSquare) {
      state.statusMessage = 'Select a square first to summon a piece.';
      redraw();
      return;
    }
    sandboxSummonPiece(state.selectedSquare.row, state.selectedSquare.col, color, type);
  }

  async function maybeDoEngineMove() {
    if (state.isSandbox) return;
    if (!state.started || state.winner || state.pendingPromotion || state.isDraw || state.readOnly) return;
    if (state.mode !== 'human-vs-ai') return;
    if (state.currentTurn === state.playerColor) return;
    try {
      state.aiThinking = true;
      state.statusMessage = 'AI is thinking...';
      redraw();
      const aiState = { ...state, currentTurn: requestedSide };
      const best = await state.engine.getBestMove(aiState, { depth: 12 });
      if (!best) {
        state.aiThinking = false;
        updateGameStatus();
        redraw();
        return;
      }
      await makeMove(best.from, best.to);
      state.aiThinking = false;
      redraw();
    } catch (error) {
      state.aiThinking = false;
      state.statusMessage = 'AI move failed. Please try again.';
      redraw();
      console.error(error);
    }
  }

  async function handleSquareClick(row, col) {
    if (!state.started || state.readOnly || state.replayBoard || state.aiThinking) return;
    if (state.pendingHordeSpawn) {
      await handlePendingHordeSpawn(row, col);
      return;
    }

    if (state.isSandbox) {
      const piece = getPiece(state.board, row, col);
      if (state.selectedSquare && sameSquare(state.selectedSquare, { row, col })) {
        const selectedPiece = getPiece(state.board, row, col);
        if (selectedPiece?.specialization === 'Gunslinger' && tryTriggerGunslingerAction(selectedPiece, row, col)) {
          return;
        }
        clearSelection();
        state.statusMessage = 'Selection cleared.';
        redraw();
        return;
      }
      if (state.selectedSquare && !sameSquare(state.selectedSquare, { row, col })) {
        const selectedPiece = getPiece(state.board, state.selectedSquare.row, state.selectedSquare.col);
        if (selectedPiece) {
          sandboxMovePiece(state.selectedSquare.row, state.selectedSquare.col, row, col);
          return;
        }
      }
      if (piece) {
        state.selectedSquare = { row, col };
        state.statusMessage = `Selected ${piece.color} ${piece.type} on ${toChessCoord(row, col)}.`;
      } else {
        state.selectedSquare = { row, col };
        state.statusMessage = `Selected empty square ${toChessCoord(row, col)}.`;
      }
      redraw();
      return;
    }

    if (state.winner || state.pendingPromotion || state.isDraw) return;
    if (state.mode === 'human-vs-ai' && state.currentTurn !== state.playerColor) return;

    const piece = getPiece(state.board, row, col);
    if (piece && state.isSpecialized && (state.specializedStatusById?.[piece.id]?.frozen || Object.values(state?.bladeRunnerPendingKillsByColor || {}).some(ids => Array.isArray(ids) && ids.includes(piece.id)))) {
      if (Object.values(state?.bladeRunnerPendingKillsByColor || {}).some(ids => Array.isArray(ids) && ids.includes(piece.id))) {
        state.statusMessage = 'This piece is marked for Blade Runner delayed death and cannot move.';
        redraw();
        return;
      }
      if (state.selectedSquare && sameSquare(state.selectedSquare, { row, col })) {
        spendTurnToUnfreeze(piece);
        return;
      }
      state.selectedSquare = { row, col };
      state.validMoves = [{ row, col }];
      state.statusMessage = `${piece.color} ${piece.type} is Frozen. Tap again to spend the turn and unfreeze.`;
      redraw();
      return;
    }
    if (state.selectedSquare) {
      const isTarget = state.validMoves.some(move => move.row === row && move.col === col);
      if (isTarget) {
        const selectedPiece = getPiece(state.board, state.selectedSquare.row, state.selectedSquare.col);
        if (state.activeDancerSpecialPieceId && selectedPiece?.id === state.activeDancerSpecialPieceId) {
          state.board[row][col] = selectedPiece;
          state.board[state.selectedSquare.row][state.selectedSquare.col] = null;
          state.lastMove = { from: state.selectedSquare, to: { row, col } };
          state.statusMessage = `${selectedPiece.color} Dancer used special movement.`;
          state.dancerStateById = { ...(state.dancerStateById || {}), [selectedPiece.id]: { armed: false } };
          clearSelection();
          state.activeDancerSpecialPieceId = null;
          await finalizeTurn();
          redraw();
          maybeDoEngineMove();
          return;
        }
        await makeMove(state.selectedSquare, { row, col });
        redraw();
        maybeDoEngineMove();
        return;
      }
      if (sameSquare(state.selectedSquare, { row, col })) {
        if (piece?.specialization === 'Gunslinger' && tryTriggerGunslingerAction(piece, row, col)) {
          return;
        }
        if (piece?.specialization === 'Djinn' && tryDissipateDjinn(piece, row, col)) {
          return;
        }
        if (piece?.specialization === 'Rocketman' && await tryRocketmanBlastOff(piece, row, col)) {
          return;
        }
        if (piece?.specialization === 'Dancer' && state.dancerStateById?.[piece.id]?.armed) {
          if (state.activeDancerSpecialPieceId === piece.id) {
            state.activeDancerSpecialPieceId = null;
            clearSelection();
            redraw();
            return;
          }
          enterDancerSpecialMode(piece);
          return;
        }
        clearSelection();
        redraw();
        return;
      }
    }

    if (piece && piece.color === state.currentTurn) {
      if (state.activeDancerSpecialPieceId && piece.id !== state.activeDancerSpecialPieceId) {
        state.activeDancerSpecialPieceId = null;
      }
      setSelection(row, col);
    } else {
      clearSelection();
    }
    redraw();
  }

  function applySessionRow(sessionRow, moves = []) {
    state.sessionId = sessionRow.id;
    state.mode = sessionRow.mode === 'human-vs-ai' ? 'human-vs-ai' : GAME_MODES.HUMAN_VS_HUMAN;
    updateRulesetState(sessionRow.ruleset || 'normal');
    if (state.user) {
      if (sessionRow.white_user_id === state.user.id) state.playerColor = 'white';
      else if (sessionRow.black_user_id === state.user.id) state.playerColor = 'black';
    }
    state.currentTurn = sessionRow.current_turn;
    state.board = sessionRow.board_state_json;
    state.castlingRights = sessionRow.castling_rights_json;
    state.enPassantTarget = sessionRow.en_passant_target_json;
    state.halfmoveClock = sessionRow.halfmove_clock;
    state.fullmoveNumber = sessionRow.fullmove_number;
    state.positionHistory = sessionRow.position_history_json || {};
    const loadedAssignments = sessionRow.specialized_assignments_json || createEmptyAssignments();
    state.specializedAssignments = normalizeAssignmentSlots(loadedAssignments);
    state.moveHistory = moves.map(move => move.san);
    state.moveLog = state.moveHistory.map((san, index) => formatMoveEntry(index, san));
    applySpecializationsToBoard();
    state.started = true;
    state.pendingPromotion = null;
    state.pendingPromotionMove = null;
    state.readOnly = sessionRow.status === 'finished';
    state.winner = null;
    state.isDraw = false;
    state.statusMessage = sessionRow.result ? `Stored result: ${sessionRow.result}` : '';
    state.replayStates = [
      { board: sessionRow.board_state_json, currentTurn: sessionRow.current_turn, result: sessionRow.result, status: sessionRow.status },
      ...moves.map((move, idx) => ({
        board: move.board_state_after_json || sessionRow.board_state_json,
        currentTurn: idx % 2 === 0 ? 'black' : 'white',
        result: null,
        status: 'active',
      })),
    ];
    state.replayIndex = state.replayStates.length - 1;
    state.replayBoard = null;
    clearSelection();
    updateGameStatus();
  }

  async function loadSession(sessionId) {
    const data = await api.getSession(sessionId);
    applySessionRow(data.session, data.moves || []);
    redraw();
    maybeDoEngineMove();
  }

  function resetLocal(mode = state.mode, playerColor = state.playerColor) {
    const preservedUser = state.user;
    const preservedSessions = state.sessions;
    const next = createInitialState({ mode, playerColor });
    state = {
      ...next,
      validMoves: [],
      checkColor: null,
      statusMessage: '',
      isDraw: false,
      user: preservedUser,
      sessions: preservedSessions,
      sessionId: null,
      readOnly: false,
      moveHistory: [],
      pendingPromotionMove: null,
      lastMove: null,
      replayStates: [],
      replayIndex: 0,
      replayBoard: null,
      engine: createEngine(),
      aiThinking: false,
      isSpecialized: state.isSpecialized,
      isSandbox: state.isSandbox,
      specializedAssignments: { white: [null], black: [null] },
      sandboxHistory: [],
    };
    redraw();
  }

  async function startGame() {
    state.specializedAssignments = normalizeAssignmentSlots(state.specializedAssignments || createEmptyAssignments());
    state.started = true;
    state.statusMessage = '';
    applySpecializationsToBoard();
    resolveBlueprintTransformations();
    updateIcicleFreezeState();
    updateGunslingerThreatState();
    clearSelection();
    if (!state.isSandbox && Object.keys(state.positionHistory).length === 0) {
      incrementPositionHistory(state);
    }
    state.replayStates = [{ board: cloneBoardState(state.board), currentTurn: state.currentTurn, result: state.result || null, status: state.winner || state.isDraw ? 'finished' : 'active' }];
    state.replayIndex = 0;
    state.replayBoard = null;
    updateGameStatus();
    redraw();
    maybeDoEngineMove();
  }


  function handleSpecializedSetupSideChange(side) {
    state.specializedSetupSide = side;
    redraw();
  }

  function handleAddSpecializedAssignmentRow(side) {
    const next = normalizeAssignmentSlots(state.specializedAssignments || createEmptyAssignments());
    if (next[side].length >= 16) {
      redraw();
      return;
    }
    next[side] = [...next[side], null];
    state.specializedAssignments = next;
    redraw();
  }

  function handleSpecializedAssignment(side, index, assignment) {
    const next = normalizeAssignmentSlots(state.specializedAssignments || createEmptyAssignments());
    if (!assignment) {
      next[side][index] = null;
      state.specializedAssignments = next;
      redraw();
      return;
    }
    if (assignment.square) {
      const duplicate = next[side].some((item, idx) => idx !== index && item && item.square === assignment.square);
      if (duplicate) {
        redraw();
        return;
      }
    }
    next[side][index] = {
      pieceType: assignment.pieceType,
      specialization: assignment.specialization,
      square: assignment.square || '',
    };
    state.specializedAssignments = next;
    redraw();
  }

  async function handleDeleteSession(session) {
    const label = session.name || `Session ${String(session.id).slice(0, 8)}`;
    if (!window.confirm(`Delete session \"${label}\"? This cannot be undone.`)) return;
    await api.deleteSession(session.id);
    if (state.sessionId === session.id) resetLocal();
    await refreshSessions();
  }

  async function handleRenameSession(session) {
    const current = session.name || `Session ${String(session.id).slice(0, 8)}`;
    const next = window.prompt('Rename session', current);
    if (!next) return;
    await api.updateSession(session.id, { name: next.trim() });
    await refreshSessions();
  }

  async function handleLogin() {
    try {
      const { username, password } = getLoginFormValues();
      const data = await api.login(username, password);
      state.user = data.user;
      renderAuth(state.user);
      await refreshSessions();
    } catch (error) {
      renderAuth(null, error.message);
    }
  }

  async function handleLogout() {
    await api.logout();
    state.user = null;
    state.sessions = [];
    state.sessionId = null;
    state.readOnly = false;
    renderAuth(null);
    redraw();
  }

  async function handleCreateSession() {
    if (!state.user) {
      renderAuth(null, 'Please log in first.');
      return;
    }
    const values = getNewSessionValues();
    const mode = values.mode === 'human-vs-ai' ? 'human-vs-ai' : 'human-vs-human';
    const ruleset = state.isSandbox ? 'sandbox' : values.specialized ? 'specialized' : 'normal';
    const data = await api.createSession({ mode, side: values.side, name: values.name, ruleset, specializedAssignments: state.isSpecialized ? state.specializedAssignments : createEmptyAssignments() });
    await refreshSessions();
    await loadSession(data.session.id);
  }

  async function init() {
    bindControls({
      onReset: () => resetLocal(),
      onModeChange: mode => resetLocal(mode, state.playerColor),
      onPlayerColorChange: color => { state.playerColor = color; redraw(); },
      onStart: () => startGame(),
      onLogin: () => handleLogin(),
      onLogout: () => handleLogout(),
      onCreateSession: () => handleCreateSession(),
      onReplayStart: () => { if (state.replayStates.length) { jumpToReplayIndex(0); } },
      onReplayPrev: () => { if (state.replayStates.length) { jumpToReplayIndex(Math.max(0, state.replayIndex - 1)); } },
      onReplayNext: () => { if (state.replayStates.length) { jumpToReplayIndex(Math.min(state.replayStates.length - 1, state.replayIndex + 1)); } },
      onReplayEnd: () => { if (state.replayStates.length) { jumpToReplayIndex(state.replayStates.length - 1); state.replayBoard = null; redraw(); } },
      onRulesetChange: ruleset => {
        updateRulesetState(ruleset);
        redraw();
      },
    });

    try {
      const me = await api.me();
      state.user = me.user;
      renderAuth(state.user);
      if (state.user) await refreshSessions();
    } catch {
      renderAuth(null);
    }

    redraw();
  }

  return { init };
}
