import { COLORS, GAME_MODES } from './config.js';
import { PIECE_TYPES, getPieceLabel } from './pieces.js';
import { createInitialState } from './state.js';
import { getPiece, getLegalMoves, applyMove, isKingInCheck, hasAnyLegalMove } from './board.js';
import { renderBoard, renderMoveLog, renderStatus, bindControls, syncControls, renderPromotionControls } from './ui.js';

function sameSquare(a, b) {
  return a && b && a.row === b.row && a.col === b.col;
}

function toChessCoord(row, col) {
  const files = 'abcdefgh';
  return `${files[col]}${8 - row}`;
}

function getOpponentColor(color) {
  return color === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
}

export function createGame() {
  let state = {
    ...createInitialState({ mode: GAME_MODES.HUMAN_VS_HUMAN, playerColor: COLORS.WHITE }),
    validMoves: [],
    checkColor: null,
    statusMessage: '',
  };

  function updateGameStatus() {
    const sideToMove = state.currentTurn;
    const inCheck = isKingInCheck(state.board, sideToMove);
    const hasMove = hasAnyLegalMove(state.board, sideToMove, state);

    state.checkColor = inCheck ? sideToMove : null;
    state.statusMessage = '';
    state.winner = null;

    if (inCheck && !hasMove) {
      state.winner = getOpponentColor(sideToMove);
      state.statusMessage = `${sideToMove} is checkmated.`;
      return;
    }

    if (!inCheck && !hasMove) {
      state.statusMessage = 'Stalemate.';
      return;
    }

    if (inCheck) {
      state.statusMessage = `${sideToMove} is in check.`;
    }
  }

  function redraw() {
    renderBoard(state, handleSquareClick);
    renderStatus(state);
    renderMoveLog(state);
    renderPromotionControls(state, handlePromotion);
    syncControls(state);
  }

  function setSelection(row, col) {
    state.selectedSquare = { row, col };
    state.validMoves = getLegalMoves(state.board, row, col, state);
  }

  function clearSelection() {
    state.selectedSquare = null;
    state.validMoves = [];
  }

  function addMoveLog(piece, from, to, notation = '') {
    const label = getPieceLabel(piece);
    const suffix = notation ? ` (${notation})` : '';
    state.moveLog = [
      ...state.moveLog,
      `${label}: ${toChessCoord(from.row, from.col)} → ${toChessCoord(to.row, to.col)}${suffix}`,
    ];
  }

  function finalizeTurn() {
    state.currentTurn = getOpponentColor(state.currentTurn);
    clearSelection();
    updateGameStatus();
  }

  function handlePromotion(pieceType) {
    if (!state.pendingPromotion) return;
    const { row, col } = state.pendingPromotion;
    const piece = state.board[row][col];
    if (!piece || piece.type !== PIECE_TYPES.PAWN) return;

    state.board[row][col] = { ...piece, type: pieceType };
    state.moveLog = [
      ...state.moveLog.slice(0, -1),
      `${state.moveLog[state.moveLog.length - 1]} (promoted to ${pieceType})`,
    ];
    state.pendingPromotion = null;
    finalizeTurn();
    redraw();
    maybeDoEngineMove();
  }

  function makeMove(from, to) {
    const piece = getPiece(state.board, from.row, from.col);
    const applied = applyMove(state.board, from.row, from.col, to.row, to.col, state);

    state.board = applied.board;
    state.castlingRights = applied.castlingRights;
    state.enPassantTarget = applied.enPassantTarget;
    addMoveLog(piece, from, to, applied.notation || '');

    if (applied.promotion) {
      state.pendingPromotion = applied.promotion;
      clearSelection();
      redraw();
      return;
    }

    finalizeTurn();
  }

  function maybeDoEngineMove() {
    if (!state.started || state.winner || state.pendingPromotion) return;
    if (state.mode !== GAME_MODES.HUMAN_VS_ENGINE) return;
    if (state.currentTurn === state.playerColor) return;

    const legalMoves = [];
    state.board.forEach((row, rowIndex) => {
      row.forEach((piece, colIndex) => {
        if (piece && piece.color === state.currentTurn) {
          const moves = getLegalMoves(state.board, rowIndex, colIndex, state);
          moves.forEach(move => {
            legalMoves.push({ from: { row: rowIndex, col: colIndex }, to: move });
          });
        }
      });
    });

    if (legalMoves.length === 0) {
      updateGameStatus();
      redraw();
      return;
    }

    const chosen = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    setTimeout(() => {
      makeMove(chosen.from, chosen.to);
      if (state.pendingPromotion) {
        handlePromotion(PIECE_TYPES.QUEEN);
        return;
      }
      redraw();
    }, 350);
  }

  function handleSquareClick(row, col) {
    if (!state.started || state.winner || state.pendingPromotion) return;
    if (state.mode === GAME_MODES.HUMAN_VS_ENGINE && state.currentTurn !== state.playerColor) return;

    const piece = getPiece(state.board, row, col);

    if (state.selectedSquare) {
      const isTarget = state.validMoves.some(move => move.row === row && move.col === col);
      if (isTarget) {
        makeMove(state.selectedSquare, { row, col });
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

  function reset(mode = state.mode, playerColor = state.playerColor) {
    state = {
      ...createInitialState({ mode, playerColor }),
      validMoves: [],
      checkColor: null,
      statusMessage: '',
    };
    redraw();
  }

  function startGame() {
    state.started = true;
    clearSelection();
    updateGameStatus();
    redraw();
    maybeDoEngineMove();
  }

  function init() {
    bindControls({
      onReset: () => reset(),
      onModeChange: mode => reset(mode, state.playerColor),
      onPlayerColorChange: color => reset(state.mode, color),
      onStart: () => startGame(),
    });
    redraw();
  }

  return { init };
}
