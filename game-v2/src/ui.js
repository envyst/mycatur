import { getPieceLabel, getPieceSymbol } from './pieces.js';
import { THEME_OPTIONS } from './config.js';

export function renderBoard(state, onSquareClick) {
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';

  const selected = state.selectedSquare;
  const validTargets = selected
    ? state.validMoves.map(move => `${move.row}:${move.col}`)
    : [];

  state.board.forEach((row, rowIndex) => {
    row.forEach((piece, colIndex) => {
      const square = document.createElement('button');
      square.className = `square ${(rowIndex + colIndex) % 2 === 0 ? 'light' : 'dark'}`;
      square.type = 'button';
      square.dataset.row = rowIndex;
      square.dataset.col = colIndex;

      if (selected && selected.row === rowIndex && selected.col === colIndex) {
        square.classList.add('selected');
      }

      if (validTargets.includes(`${rowIndex}:${colIndex}`)) {
        square.classList.add('target');
      }

      if (piece) {
        const span = document.createElement('span');
        span.className = 'piece';
        span.textContent = getPieceSymbol(piece);
        span.title = `${piece.color} ${getPieceLabel(piece, state.themes)}`;
        square.appendChild(span);
      }

      square.addEventListener('click', () => onSquareClick(rowIndex, colIndex));
      boardEl.appendChild(square);
    });
  });
}

export function renderStatus(state) {
  const statusEl = document.getElementById('status');

  if (!state.started) {
    statusEl.textContent = 'Choose a mode and theme labels, then start the game.';
    return;
  }

  if (state.winner) {
    statusEl.textContent = `${state.winner} wins.`;
    return;
  }

  const modeLabel = state.mode === 'human-vs-engine' ? 'Human vs Engine' : 'Human vs Human';
  statusEl.textContent = `Mode: ${modeLabel} | Current turn: ${state.currentTurn}`;
}

export function renderMoveLog(state) {
  const logEl = document.getElementById('moveLog');
  logEl.innerHTML = '';

  if (state.moveLog.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'log-entry';
    empty.textContent = 'No moves yet.';
    logEl.appendChild(empty);
    return;
  }

  state.moveLog.forEach((entry, index) => {
    const item = document.createElement('div');
    item.className = 'log-entry';
    item.textContent = `${index + 1}. ${entry}`;
    logEl.appendChild(item);
  });
}

export function bindControls({ onReset, onModeChange, onPlayerColorChange, onStart }) {
  document.getElementById('resetButton').addEventListener('click', onReset);
  document.getElementById('startButton').addEventListener('click', onStart);
  document.getElementById('modeSelect').addEventListener('change', event => onModeChange(event.target.value));
  document.getElementById('playerColorSelect').addEventListener('change', event => onPlayerColorChange(event.target.value));
}

export function initThemeSelectors(currentThemes, onThemeChange) {
  for (const [pieceType, options] of Object.entries(THEME_OPTIONS)) {
    const el = document.getElementById(`${pieceType}ThemeSelect`);
    el.innerHTML = '';
    options.forEach(label => {
      const opt = document.createElement('option');
      opt.value = label;
      opt.textContent = label;
      if (currentThemes[pieceType] === label) {
        opt.selected = true;
      }
      el.appendChild(opt);
    });
    el.addEventListener('change', event => onThemeChange(pieceType, event.target.value));
  }
}

export function syncControls(state) {
  document.getElementById('modeSelect').value = state.mode;
  document.getElementById('playerColorSelect').value = state.playerColor;

  for (const pieceType of Object.keys(THEME_OPTIONS)) {
    const el = document.getElementById(`${pieceType}ThemeSelect`);
    if (el) el.value = state.themes[pieceType];
  }
}
