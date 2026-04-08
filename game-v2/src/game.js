import { COLORS, GAME_MODES } from './config.js';
import { PIECE_TYPES } from './pieces.js';
import { createInitialState } from './state.js';
import { getPiece, getLegalMoves, applyMove, isKingInCheck, hasAnyLegalMove, createPositionKey, findKing } from './board.js';
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
import { createEmptyAssignments } from './specialized.js';

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

  function normalizeAssignmentSlots(assignments) {
    return {
      white: Array.from({ length: 6 }, (_, i) => assignments.white?.[i] || null),
      black: Array.from({ length: 6 }, (_, i) => assignments.black?.[i] || null),
    };
  }

  function updateGameStatus() {
    if (state.isSandbox) {
      const sideToMove = state.currentTurn;
      const inCheck = isKingInCheck(state.board, sideToMove);
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
    const inCheck = isKingInCheck(state.board, sideToMove);
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
    renderSpecializedSetup(state, handleSpecializedAssignment);
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
    state.replayBoard = state.replayIndex === state.replayStates.length - 1 ? null : state.replayStates[state.replayIndex].board;
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

  async function persistState(move = null) {
    if (!state.sessionId || state.readOnly) return;
    await api.updateSession(state.sessionId, buildSessionPayload(state, move));
    await refreshSessions();
  }

  async function finalizeTurn(move = null) {
    state.currentTurn = getOpponentColor(state.currentTurn);
    incrementPositionHistory(state);
    clearSelection();
    updateGameStatus();
    await persistState(move);
  }

  async function handlePromotion(pieceType) {
    if (!state.pendingPromotion || state.readOnly || !state.pendingPromotionMove) return;
    const { row, col } = state.pendingPromotion;
    const piece = state.board[row][col];
    if (!piece || piece.type !== PIECE_TYPES.PAWN) return;
    state.board[row][col] = { ...piece, type: pieceType };
    state.pendingPromotion = null;
    state.pendingPromotionMove = null;
    redraw();
  }

  async function makeMove(from, to) {
    const boardBefore = cloneBoardState(state.board);
    const piece = getPiece(state.board, from.row, from.col);
    const capturedPiece = getPiece(state.board, to.row, to.col);
    const applied = applyMove(state.board, from.row, from.col, to.row, to.col, state);
    state.board = applied.board;
    state.castlingRights = applied.castlingRights;
    state.enPassantTarget = applied.enPassantTarget;
    const nextTurn = getOpponentColor(piece.color);
    const provisionalSan = buildSan(piece, from, to, applied, capturedPiece, null, boardBefore, state, state.board, nextTurn);
    state.lastMove = { from, to };
    state.moveHistory = [...state.moveHistory, provisionalSan];
    state.moveLog = [...state.moveLog, formatMoveEntry(state.moveHistory.length - 1, provisionalSan)];
    if (applied.promotion) {
      state.pendingPromotion = applied.promotion;
      clearSelection();
      redraw();
      return;
    }
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
      const aiState = { ...state, currentTurn: requestedSide };
      const best = await state.engine.getBestMove(aiState, { depth: 12 });
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

    if (state.isSandbox) {
      const piece = getPiece(state.board, row, col);
      if (state.selectedSquare && sameSquare(state.selectedSquare, { row, col })) {
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
    if (state.selectedSquare) {
      const isTarget = state.validMoves.some(move => move.row === row && move.col === col);
      if (isTarget) {
        await makeMove(state.selectedSquare, { row, col });
        redraw();
        maybeDoEngineMove();
        return;
      }
      if (sameSquare(state.selectedSquare, { row, col })) {
        clearSelection();
        redraw();
        return;
      }
    }

    if (piece && piece.color === state.currentTurn) {
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
    state.replayStates = [{ board: sessionRow.board_state_json }, ...moves.map(move => ({ board: move.board_state_after_json || sessionRow.board_state_json }))];
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
      specializedAssignments: { white: Array(6).fill(null), black: Array(6).fill(null) },
      sandboxHistory: [],
    };
    redraw();
  }

  async function startGame() {
    state.specializedAssignments = normalizeAssignmentSlots(state.specializedAssignments || createEmptyAssignments());
    state.started = true;
    state.statusMessage = '';
    applySpecializationsToBoard();
    clearSelection();
    if (!state.isSandbox && Object.keys(state.positionHistory).length === 0) {
      incrementPositionHistory(state);
    }
    updateGameStatus();
    redraw();
    maybeDoEngineMove();
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
      onReplayStart: () => { if (state.replayStates.length) { state.replayIndex = 0; state.replayBoard = state.replayStates[0].board; redraw(); } },
      onReplayPrev: () => { if (state.replayStates.length) { state.replayIndex = Math.max(0, state.replayIndex - 1); state.replayBoard = state.replayStates[state.replayIndex].board; redraw(); } },
      onReplayNext: () => { if (state.replayStates.length) { state.replayIndex = Math.min(state.replayStates.length - 1, state.replayIndex + 1); state.replayBoard = state.replayStates[state.replayIndex].board; redraw(); } },
      onReplayEnd: () => { if (state.replayStates.length) { state.replayIndex = state.replayStates.length - 1; state.replayBoard = null; redraw(); } },
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
