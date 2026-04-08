import { getPieceLabel, getPieceSymbol, PIECE_TYPES } from './pieces.js';

function getDisplayRows(playerColor) {
  return playerColor === 'white'
    ? [0, 1, 2, 3, 4, 5, 6, 7]
    : [7, 6, 5, 4, 3, 2, 1, 0];
}

function getDisplayCols(playerColor) {
  return playerColor === 'white'
    ? [0, 1, 2, 3, 4, 5, 6, 7]
    : [7, 6, 5, 4, 3, 2, 1, 0];
}

export function renderBoard(state, onSquareClick) {
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';

  const selected = state.selectedSquare;
  const validTargets = selected
    ? state.validMoves.map(move => `${move.row}:${move.col}`)
    : [];

  const displayRows = getDisplayRows(state.playerColor);
  const displayCols = getDisplayCols(state.playerColor);

  displayRows.forEach(rowIndex => {
    displayCols.forEach(colIndex => {
      const piece = state.board[rowIndex][colIndex];
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
        span.className = `piece ${piece.color === 'white' ? 'white-piece' : 'black-piece'}`;
        span.textContent = getPieceSymbol(piece);
        span.title = getPieceLabel(piece);
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
    statusEl.textContent = 'Press Start Game to begin.';
    return;
  }

  if (state.pendingPromotion) {
    statusEl.textContent = `${state.pendingPromotion.color} pawn must be promoted.`;
    return;
  }

  if (state.winner) {
    statusEl.textContent = `${state.winner} wins. ${state.statusMessage || ''}`.trim();
    return;
  }

  const modeLabel = state.mode === 'human-vs-engine' ? 'Human vs Engine' : 'Human vs Human';
  const extra = state.statusMessage ? ` | ${state.statusMessage}` : '';
  statusEl.textContent = `Mode: ${modeLabel} | Current turn: ${state.currentTurn}${extra}`;
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

export function renderPromotionControls(state, onPromote) {
  let section = document.getElementById('promotionSection');
  if (!section) {
    section = document.createElement('div');
    section.id = 'promotionSection';
    section.className = 'section';
    section.innerHTML = `
      <h2>Promotion</h2>
      <div id="promotionChoices" class="controls"></div>
    `;
    const sidebar = document.querySelector('.sidebar');
    sidebar.appendChild(section);
  }

  const choicesEl = document.getElementById('promotionChoices');

  if (!state.pendingPromotion) {
    section.style.display = 'none';
    choicesEl.innerHTML = '';
    return;
  }

  section.style.display = 'block';
  const choices = [PIECE_TYPES.QUEEN, PIECE_TYPES.ROOK, PIECE_TYPES.BISHOP, PIECE_TYPES.KNIGHT];
  choicesEl.innerHTML = '';

  choices.forEach(type => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = `Promote to ${type}`;
    btn.addEventListener('click', () => onPromote(type));
    choicesEl.appendChild(btn);
  });
}

export function bindControls({ onReset, onModeChange, onPlayerColorChange, onStart }) {
  document.getElementById('resetButton').addEventListener('click', onReset);
  document.getElementById('startButton').addEventListener('click', onStart);
  document.getElementById('modeSelect').addEventListener('change', event => onModeChange(event.target.value));
  document.getElementById('playerColorSelect').addEventListener('change', event => onPlayerColorChange(event.target.value));
}

export function syncControls(state) {
  document.getElementById('modeSelect').value = state.mode;
  document.getElementById('playerColorSelect').value = state.playerColor;
}
