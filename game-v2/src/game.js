import { COLORS, GAME_MODES } from './config.js';
import { PIECE_TYPES } from './pieces.js';
import { createInitialState } from './state.js';
import { getPiece, getLegalMoves, applyMove, isKingInCheck, hasAnyLegalMove, createPositionKey } from './board.js';
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
  renderReplayControls,
  getLoginFormValues,
  getNewSessionValues,
} from './ui.js';
import { api } from './api.js';
import { createEngine } from './engine.js';
import { setAssignment } from './specialized.js';

function sameSquare(a, b) {
  return a && b && a.row === b.row && a.col === b.col;
}

function toChessCoord(row, col) {
  const files = 'abcdefgh';
  return `${files[col]}${8 - row}`;
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

function getRemainingMaterial(board) {
  const pieces = [];
  board.forEach(row => row.forEach(piece => { if (piece) pieces.push(piece); }));
  return pieces;
}

function isInsufficientMaterial(board) {
  const nonKings = getRemainingMaterial(board).filter(piece => piece.type !== PIECE_TYPES.KING);
  if (nonKings.length === 0) return true;
  if (nonKings.length === 1) {
    return [PIECE_TYPES.BISHOP, PIECE_TYPES.KNIGHT].includes(nonKings[0].type);
  }
  if (nonKings.length === 2 && nonKings.every(piece => piece.type === PIECE_TYPES.BISHOP)) {
    return true;
  }
  return false;
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
  if (applied.notation === 'castle kingside') {
    let san = 'O-O';
    if (boardAfter && nextTurn) {
      const inCheck = isKingInCheck(boardAfter, nextTurn);
      const hasMove = hasAnyLegalMove(boardAfter, nextTurn, { ...gameState, board: boardAfter, currentTurn: nextTurn, enPassantTarget: applied.enPassantTarget, castlingRights: applied.castlingRights });
      if (inCheck && !hasMove) san += '#';
      else if (inCheck) san += '+';
    }
    return san;
  }
  if (applied.notation === 'castle queenside') {
    let san = 'O-O-O';
    if (boardAfter && nextTurn) {
      const inCheck = isKingInCheck(boardAfter, nextTurn);
      const hasMove = hasAnyLegalMove(boardAfter, nextTurn, { ...gameState, board: boardAfter, currentTurn: nextTurn, enPassantTarget: applied.enPassantTarget, castlingRights: applied.castlingRights });
      if (inCheck && !hasMove) san += '#';
      else if (inCheck) san += '+';
    }
    return san;
  }

  const destination = toChessCoord(to.row, to.col);
  const capture = capturedPiece || applied.isCapture;
  const prefix = piece.type === PIECE_TYPES.PAWN ? '' : pieceLetter(piece.type);
  const pawnCapturePrefix = piece.type === PIECE_TYPES.PAWN && capture ? fileLetter(from.col) : '';
  const disambiguation = boardBefore && gameState ? buildDisambiguation(boardBefore, piece, from, to, gameState) : '';
  const separator = capture ? 'x' : '';
  const promotionSuffix = promotionPiece ? `=${pieceLetter(promotionPiece)}` : '';
  let san = `${prefix}${disambiguation}${prefix ? separator : pawnCapturePrefix ? separator : ''}`;

  if (piece.type === PIECE_TYPES.PAWN) {
    san = `${pawnCapturePrefix}${separator}${destination}${promotionSuffix}`;
    if (!capture) san = `${destination}${promotionSuffix}`;
  } else {
    san = `${prefix}${disambiguation}${separator}${destination}${promotionSuffix}`;
  }

  if (boardAfter && nextTurn) {
    const nextState = {
      ...gameState,
      board: boardAfter,
      currentTurn: nextTurn,
      enPassantTarget: applied.enPassantTarget,
      castlingRights: applied.castlingRights,
    };
    const inCheck = isKingInCheck(boardAfter, nextTurn);
    const hasMove = hasAnyLegalMove(boardAfter, nextTurn, nextState);
    if (inCheck && !hasMove) san += '#';
    else if (inCheck) san += '+';
  }

  return san;
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
  };

  function updateGameStatus() {
    const sideToMove = state.currentTurn;
    const inCheck = isKingInCheck(state.board, sideToMove);
    const hasMove = hasAnyLegalMove(state.board, sideToMove, state);
    const currentPositionKey = createPositionKey(state.board, state.currentTurn, state.castlingRights, state.enPassantTarget);
    const repetitionCount = state.positionHistory[currentPositionKey] || 0;

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
    if (state.halfmoveClock >= 100) {
      state.isDraw = true;
      state.statusMessage = 'Draw by fifty-move rule.';
      return;
    }
    if (state.positionHistory[currentPositionKey] >= 3) {
      state.isDraw = true;
      state.statusMessage = 'Draw by threefold repetition.';
      return;
    }
    if (isInsufficientMaterial(state.board)) {
      state.isDraw = true;
      state.statusMessage = 'Draw by insufficient material.';
      return;
    }
    if (inCheck) {
      state.statusMessage = `${sideToMove} is in check.`;
    }
  }


  function scrollActiveReplayMoveIntoView() {
    const active = document.querySelector('[data-active-replay-move="true"]');
    if (active) {
      active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
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
    renderReplayControls(state);
    syncControls(state);
    if (state.replayBoard) {
      setTimeout(scrollActiveReplayMoveIntoView, 0);
    }
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
    state.validMoves = getLegalMoves(state.board, row, col, state);
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

  function computeMoveIndex() {
    return state.moveHistory.length;
  }

  async function finalizeTurn(move = null) {
    state.currentTurn = getOpponentColor(state.currentTurn);
    if (state.currentTurn === COLORS.WHITE) {
      state.fullmoveNumber += 1;
    }
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
    const nextTurn = getOpponentColor(piece.color);
    const san = buildSan(
      { ...piece, type: PIECE_TYPES.PAWN },
      state.pendingPromotionMove.from,
      state.pendingPromotionMove.to,
      state.pendingPromotionMove.applied,
      state.pendingPromotionMove.capturedPiece,
      pieceType,
      state.pendingPromotionMove.boardBefore,
      state.pendingPromotionMove.gameStateBefore,
      state.board,
      nextTurn,
    );
    state.moveHistory[state.moveHistory.length - 1] = san;
    state.moveLog[state.moveLog.length - 1] = formatMoveEntry(state.moveHistory.length - 1, san);
    state.pendingPromotion = null;

    const movePayload = {
      moveIndex: state.moveHistory.length,
      side: piece.color,
      fromSquare: toChessCoord(state.pendingPromotionMove.from.row, state.pendingPromotionMove.from.col),
      toSquare: toChessCoord(state.pendingPromotionMove.to.row, state.pendingPromotionMove.to.col),
      piece: 'pawn',
      promotionPiece: pieceType,
      san,
    };
    state.pendingPromotionMove = null;
    await finalizeTurn(movePayload);
    redraw();
    maybeDoEngineMove();
  }

  async function makeMove(from, to) {
    const boardBefore = structuredClone(state.board);
    const gameStateBefore = {
      board: structuredClone(state.board),
      currentTurn: state.currentTurn,
      castlingRights: structuredClone(state.castlingRights),
      enPassantTarget: state.enPassantTarget ? { ...state.enPassantTarget } : null,
      halfmoveClock: state.halfmoveClock,
      fullmoveNumber: state.fullmoveNumber,
      positionHistory: { ...state.positionHistory },
    };
    const piece = getPiece(state.board, from.row, from.col);
    const capturedPiece = getPiece(state.board, to.row, to.col);
    const applied = applyMove(state.board, from.row, from.col, to.row, to.col, state);

    state.board = applied.board;
    state.castlingRights = applied.castlingRights;
    state.enPassantTarget = applied.enPassantTarget;
    state.halfmoveClock = applied.resetsHalfmoveClock ? 0 : state.halfmoveClock + 1;

    const nextTurn = getOpponentColor(piece.color);
    const provisionalSan = buildSan(piece, from, to, applied, capturedPiece, null, boardBefore, gameStateBefore, state.board, nextTurn);
    state.lastMove = { from, to };
    state.moveHistory = [...state.moveHistory, provisionalSan];
    state.moveLog = [...state.moveLog, formatMoveEntry(state.moveHistory.length - 1, provisionalSan)];

    const movePayload = {
      moveIndex: computeMoveIndex(),
      side: piece.color,
      fromSquare: toChessCoord(from.row, from.col),
      toSquare: toChessCoord(to.row, to.col),
      piece: piece.type,
      promotionPiece: applied.promotion ? 'pending' : null,
      san: provisionalSan,
    };

    if (applied.promotion) {
      state.pendingPromotion = applied.promotion;
      state.pendingPromotionMove = { from, to, applied, capturedPiece, boardBefore, gameStateBefore };
      clearSelection();
      await persistState(movePayload);
      redraw();
      return;
    }

    await finalizeTurn(movePayload);
  }

  async function maybeDoEngineMove() {
    if (!state.started || state.winner || state.pendingPromotion || state.isDraw || state.readOnly) return;
    if (state.mode !== 'human-vs-ai') return;
    if (state.currentTurn === state.playerColor) return;

    try {
      state.aiThinking = true;
      state.statusMessage = 'AI is thinking...';
      redraw();
      const best = await state.engine.getBestMove(state, { depth: 12 });
      if (!best) {
        state.aiThinking = false;
        updateGameStatus();
        redraw();
        return;
      }
      await makeMove(best.from, best.to);
      if (state.pendingPromotion) {
        const promoMap = { q: PIECE_TYPES.QUEEN, r: PIECE_TYPES.ROOK, b: PIECE_TYPES.BISHOP, n: PIECE_TYPES.KNIGHT };
        await handlePromotion(promoMap[best.promotion] || PIECE_TYPES.QUEEN);
        state.aiThinking = false;
        return;
      }
      state.aiThinking = false;
      redraw();
    } catch (error) {
      state.aiThinking = false;
      state.statusMessage = 'AI move failed. Please try again.';
      redraw();
      console.error('Engine move failed', error);
    }
  }

  async function handleSquareClick(row, col) {
    if (!state.started || state.winner || state.pendingPromotion || state.isDraw || state.readOnly || state.replayBoard || state.aiThinking) return;
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
    if (!state.engine) state.engine = createEngine();
    state.sessionId = sessionRow.id;
    state.mode = sessionRow.mode === 'human-vs-ai' ? 'human-vs-ai' : GAME_MODES.HUMAN_VS_HUMAN;
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
    state.moveHistory = moves.map(move => move.san);
    state.moveLog = state.moveHistory.map((san, index) => formatMoveEntry(index, san));
    state.started = true;
    state.pendingPromotion = null;
    state.pendingPromotionMove = null;
    state.lastMove = moves.length ? { from: null, to: null } : null;
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
    state = {
      ...createInitialState({ mode, playerColor }),
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
    };
    redraw();
  }

  async function startGame() {
    state.started = true;
    clearSelection();
    if (Object.keys(state.positionHistory).length === 0) {
      incrementPositionHistory(state);
    }
    updateGameStatus();
    redraw();
    maybeDoEngineMove();
  }



  function handleSpecializedAssignment(side, square, pieceType, specialization) {
    state.specializedAssignments = setAssignment(state.specializedAssignments, side, square, pieceType, specialization);
    redraw();
  }

  async function handleDeleteSession(session) {
    const label = session.name || `Session ${String(session.id).slice(0, 8)}`;
    const ok = window.confirm(`Delete session "${label}"? This cannot be undone.`);
    if (!ok) return;
    await api.deleteSession(session.id);
    if (state.sessionId === session.id) {
      resetLocal();
    }
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
    const { username, password } = getLoginFormValues();
    try {
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
    const data = await api.createSession({ mode, side: values.side, name: values.name });
    await refreshSessions();
    await loadSession(data.session.id);
  }

  async function init() {
    bindControls({
      onReset: () => resetLocal(),
      onModeChange: mode => resetLocal(mode, state.playerColor),
      onPlayerColorChange: color => {
        state.playerColor = color;
        redraw();
      },
      onStart: () => startGame(),
      onLogin: () => handleLogin(),
      onLogout: () => handleLogout(),
      onCreateSession: () => handleCreateSession(),
      onReplayStart: () => { if (state.replayStates.length) { state.replayIndex = 0; state.replayBoard = state.replayStates[0].board; redraw(); } },
      onReplayPrev: () => { if (state.replayStates.length) { state.replayIndex = Math.max(0, state.replayIndex - 1); state.replayBoard = state.replayStates[state.replayIndex].board; redraw(); } },
      onReplayNext: () => { if (state.replayStates.length) { state.replayIndex = Math.min(state.replayStates.length - 1, state.replayIndex + 1); state.replayBoard = state.replayStates[state.replayIndex].board; redraw(); } },
      onReplayEnd: () => { if (state.replayStates.length) { state.replayIndex = state.replayStates.length - 1; state.replayBoard = null; redraw(); } },
    });

    try {
      const me = await api.me();
      state.user = me.user;
      renderAuth(state.user);
      if (state.user) {
        await refreshSessions();
      }
    } catch {
      renderAuth(null);
    }

    redraw();
  }

  return { init };
}
