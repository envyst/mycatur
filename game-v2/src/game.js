import { COLORS, GAME_MODES } from './config.js';
import { createInitialState } from './state.js';
import { getPiece, getValidMoves, movePiece } from './board.js';
import { getPieceLabel } from './pieces.js';
import { renderBoard, renderMoveLog, renderStatus, bindControls, initThemeSelectors, syncControls } from './ui.js';

function sameSquare(a, b) {
  return a && b && a.row === b.row && a.col === b.col;
}

function toChessCoord(row, col) {
  const files = 'abcdefgh';
  return `${files[col]}${8 - row}`;
}

export function createGame() {
  let state = {
    ...createInitialState({ mode: GAME_MODES.HUMAN_VS_HUMAN, playerColor: COLORS.WHITE }),
    validMoves: [],
  };

  function redraw() {
    renderBoard(state, handleSquareClick);
    renderStatus(state);
    renderMoveLog(state);
    syncControls(state);
  }

  function setSelection(row, col) {
    state.selectedSquare = { row, col };
    state.validMoves = getValidMoves(state.board, row, col);
  }

  function clearSelection() {
    state.selectedSquare = null;
    state.validMoves = [];
  }

  function addMoveLog(piece, from, to) {
    const label = getPieceLabel(piece, state.themes);
    state.moveLog = [
      ...state.moveLog,
      `${piece.color} ${label}: ${toChessCoord(from.row, from.col)} → ${toChessCoord(to.row, to.col)}`,
    ];
  }

  function makeMove(from, to) {
    const piece = getPiece(state.board, from.row, from.col);
    state.board = movePiece(state.board, from.row, from.col, to.row, to.col);
    addMoveLog(piece, from, to);
    state.currentTurn = state.currentTurn === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
    clearSelection();
  }

  function maybeDoEngineMove() {
    if (!state.started) return;
    if (state.mode !== GAME_MODES.HUMAN_VS_ENGINE) return;
    if (state.currentTurn === state.playerColor) return;

    const legalMoves = [];
    state.board.forEach((row, rowIndex) => {
      row.forEach((piece, colIndex) => {
        if (piece && piece.color === state.currentTurn) {
          const moves = getValidMoves(state.board, rowIndex, colIndex);
          moves.forEach(move => {
            legalMoves.push({ from: { row: rowIndex, col: colIndex }, to: move });
          });
        }
      });
    });

    if (legalMoves.length === 0) return;

    const chosen = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    setTimeout(() => {
      makeMove(chosen.from, chosen.to);
      redraw();
    }, 350);
  }

  function handleSquareClick(row, col) {
    if (!state.started) return;
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

  function reset(mode = state.mode, playerColor = state.playerColor, themes = state.themes) {
    state = {
      ...createInitialState({ mode, playerColor, themes }),
      validMoves: [],
      started: false,
    };
    redraw();
  }

  function updateTheme(pieceType, label) {
    state.themes = {
      ...state.themes,
      [pieceType]: label,
    };
    redraw();
  }

  function startGame() {
    state.started = true;
    clearSelection();
    redraw();
    maybeDoEngineMove();
  }

  function init() {
    bindControls({
      onReset: () => reset(),
      onModeChange: mode => reset(mode, state.playerColor, state.themes),
      onPlayerColorChange: color => reset(state.mode, color, state.themes),
      onStart: () => startGame(),
    });

    initThemeSelectors(state.themes, updateTheme);
    redraw();
  }

  return { init };
}
