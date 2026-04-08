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


export function renderBoardBanner(state) {
  const banner = document.getElementById('boardBanner');
  const title = document.getElementById('boardBannerTitle');
  const subtitle = document.getElementById('boardBannerSubtitle');

  banner.className = 'board-banner';
  title.textContent = '';
  subtitle.textContent = '';

  if (state.replayBoard) {
    banner.classList.add('show', 'replay');
    title.textContent = 'REPLAY MODE';
    subtitle.textContent = `Viewing move ${state.replayIndex} of ${Math.max(0, state.replayStates.length - 1)}. Use replay controls or click a move in the log.`;
    return;
  }

  if (state.winner) {
    banner.classList.add('show', 'checkmate');
    title.textContent = 'CHECKMATE';
    subtitle.textContent = `${state.winner.toUpperCase()} wins. ${state.statusMessage || ''}`.trim();
    return;
  }

  if (state.isDraw) {
    banner.classList.add('show', 'draw');
    title.textContent = 'DRAW';
    subtitle.textContent = state.statusMessage || 'Game ended in a draw.';
    return;
  }
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
  const boardToRender = state.replayBoard || state.board;

  displayRows.forEach(rowIndex => {
    displayCols.forEach(colIndex => {
      const piece = boardToRender[rowIndex][colIndex];
      const square = document.createElement('button');
      square.className = `square ${(rowIndex + colIndex) % 2 === 0 ? 'light' : 'dark'}`;
      square.type = 'button';
      square.dataset.row = rowIndex;
      square.dataset.col = colIndex;

      if (!state.replayBoard && selected && selected.row === rowIndex && selected.col === colIndex) {
        square.classList.add('selected');
      }

      if (!state.replayBoard && validTargets.includes(`${rowIndex}:${colIndex}`)) {
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
    statusEl.textContent = 'Login and load or create a session, then start game.';
    return;
  }

  if (state.replayBoard) {
    statusEl.textContent = `Replay mode | Step ${state.replayIndex}/${state.replayStates.length - 1}`;
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

  if (state.isDraw) {
    statusEl.textContent = state.statusMessage || 'Draw.';
    return;
  }

  const sessionBit = state.sessionId ? ` | Session: ${state.sessionId.slice(0, 8)}` : '';
  const readOnlyBit = state.readOnly ? ' | Read-only history view' : '';
  const modeLabel = state.mode === 'human-vs-ai' ? 'Human vs AI' : 'Human vs Human';
  const extra = state.statusMessage ? ` | ${state.statusMessage}` : '';
  statusEl.textContent = `Mode: ${modeLabel} | Current turn: ${state.currentTurn}${extra}${sessionBit}${readOnlyBit}`;
}

export function renderMoveLog(state, onJumpToMove) {
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
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'log-entry';
    item.style.textAlign = 'left';
    item.style.border = 'none';
    item.style.width = '100%';
    if (state.replayBoard && state.replayIndex === index + 1) {
      item.style.outline = '2px solid rgba(110, 168, 254, 0.55)';
      item.dataset.activeReplayMove = 'true';
    }
    item.textContent = entry;
    item.addEventListener('click', () => onJumpToMove(index + 1));
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

  if (!state.pendingPromotion || state.readOnly || state.replayBoard) {
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

export function renderReplayControls(state) {
  const replayStatus = document.getElementById('replayStatus');
  const disabled = !state.replayStates.length;
  document.getElementById('replayStartButton').disabled = disabled;
  document.getElementById('replayPrevButton').disabled = disabled;
  document.getElementById('replayNextButton').disabled = disabled;
  document.getElementById('replayEndButton').disabled = disabled;
  replayStatus.textContent = disabled
    ? 'Load a saved session to replay moves.'
    : state.replayBoard
      ? `Replay step ${state.replayIndex}/${state.replayStates.length - 1}`
      : 'Live board view';
}

export function bindControls({ onReset, onModeChange, onPlayerColorChange, onStart, onLogin, onLogout, onCreateSession, onReplayStart, onReplayPrev, onReplayNext, onReplayEnd }) {
  document.getElementById('resetButton').addEventListener('click', onReset);
  document.getElementById('startButton').addEventListener('click', onStart);
  document.getElementById('modeSelect').addEventListener('change', event => onModeChange(event.target.value));
  document.getElementById('playerColorSelect').addEventListener('change', event => onPlayerColorChange(event.target.value));
  document.getElementById('loginButton').addEventListener('click', onLogin);
  document.getElementById('logoutButton').addEventListener('click', onLogout);
  document.getElementById('newSessionButton').addEventListener('click', onCreateSession);
  document.getElementById('replayStartButton').addEventListener('click', onReplayStart);
  document.getElementById('replayPrevButton').addEventListener('click', onReplayPrev);
  document.getElementById('replayNextButton').addEventListener('click', onReplayNext);
  document.getElementById('replayEndButton').addEventListener('click', onReplayEnd);
}

export function renderAuth(user, error = '') {
  const loginForm = document.getElementById('loginForm');
  const userPanel = document.getElementById('userPanel');
  const authState = document.getElementById('authState');
  const currentUser = document.getElementById('currentUser');
  const loginError = document.getElementById('loginError');

  if (user) {
    loginForm.style.display = 'none';
    userPanel.style.display = 'block';
    authState.textContent = 'Authenticated';
    currentUser.textContent = `${user.displayName} (@${user.username})`;
    loginError.textContent = '';
  } else {
    loginForm.style.display = 'flex';
    userPanel.style.display = 'none';
    authState.textContent = 'Please log in';
    currentUser.textContent = '';
    loginError.textContent = error;
  }
}

function sessionResultLabel(session) {
  if (session.result === 'white-win') return 'White won';
  if (session.result === 'black-win') return 'Black won';
  if (session.result === 'draw') return 'Draw';
  return 'In progress';
}

export function renderSessions(sessions, onOpenSession) {
  const listEl = document.getElementById('sessionList');
  listEl.innerHTML = '';

  if (!sessions.length) {
    const empty = document.createElement('div');
    empty.className = 'item';
    empty.textContent = 'No saved sessions yet.';
    listEl.appendChild(empty);
    return;
  }

  const active = sessions.filter(session => session.status !== 'finished');
  const finished = sessions.filter(session => session.status === 'finished');

  const groups = [
    { title: 'Active Sessions', items: active },
    { title: 'Finished Sessions', items: finished },
  ];

  groups.forEach(group => {
    if (!group.items.length) return;
    const heading = document.createElement('div');
    heading.className = 'item-meta';
    heading.style.marginTop = '6px';
    heading.style.fontWeight = '700';
    heading.textContent = group.title;
    listEl.appendChild(heading);

    group.items.forEach(session => {
    const item = document.createElement('div');
    item.className = 'item';
    const title = document.createElement('div');
    title.className = 'item-title';
    title.textContent = `${session.mode} • ${session.status}`;
    const meta = document.createElement('div');
    meta.className = 'item-meta';
    meta.textContent = `Result: ${sessionResultLabel(session)} | Updated: ${new Date(session.updated_at).toLocaleString()}`;
    const actions = document.createElement('div');
    actions.className = 'inline-actions';
    const button = document.createElement('button');
    button.className = 'secondary';
    button.textContent = session.status === 'finished' ? 'View / Replay' : 'Open';
    button.addEventListener('click', () => onOpenSession(session.id));
    actions.appendChild(button);
    item.appendChild(title);
    item.appendChild(meta);
    item.appendChild(actions);
    listEl.appendChild(item);
    });
  });
}

export function syncControls(state) {
  document.getElementById('modeSelect').value = state.mode;
  document.getElementById('playerColorSelect').value = state.playerColor;
}

export function getLoginFormValues() {
  return {
    username: document.getElementById('usernameInput').value.trim(),
    password: document.getElementById('passwordInput').value,
  };
}

export function getNewSessionValues() {
  return {
    mode: document.getElementById('newSessionModeSelect').value,
    side: document.getElementById('newSessionSideSelect').value,
  };
}
