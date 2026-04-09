import { getPieceLabel, getPieceSymbol, PIECE_TYPES } from './pieces.js';
import { SPECIALIZED_CATALOG, SPECIALIZED_STARTING_SQUARES, specializationMarkerLabel, friendlySquareLabel } from './specialized.js';

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

function abbreviateSandboxMarker(text) {
  const raw = (text || '').trim();
  if (!raw) return '';
  if (raw.length <= 4) return raw;
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return parts.map(part => part[0].toUpperCase()).join('.');
  }
  return raw.slice(0, 4).toUpperCase();
}

function sandboxPieceTypes() {
  return [PIECE_TYPES.KING, PIECE_TYPES.QUEEN, PIECE_TYPES.ROOK, PIECE_TYPES.BISHOP, PIECE_TYPES.KNIGHT, PIECE_TYPES.PAWN];
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
  }
}

export function renderBoard(state, onSquareClick) {
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';

  const selected = state.selectedSquare;
  const validTargets = selected ? state.validMoves.map(move => `${move.row}:${move.col}`) : [];
  const displayRows = getDisplayRows(state.playerColor);
  const displayCols = getDisplayCols(state.playerColor);
  const boardToRender = state.replayBoard || state.board;
  const lastMoveFrom = state.lastMove?.from ? `${state.lastMove.from.row}:${state.lastMove.from.col}` : null;
  const lastMoveTo = state.lastMove?.to ? `${state.lastMove.to.row}:${state.lastMove.to.col}` : null;

  displayRows.forEach((rowIndex, visualRowIndex) => {
    displayCols.forEach((colIndex, visualColIndex) => {
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

      const key = `${rowIndex}:${colIndex}`;
      if (lastMoveFrom && key === lastMoveFrom) {
        square.style.boxShadow = 'inset 0 0 0 9999px rgba(255, 196, 0, 0.42), inset 0 0 0 3px rgba(255, 230, 120, 0.95)';
      }
      if (lastMoveTo && key === lastMoveTo) {
        square.style.boxShadow = 'inset 0 0 0 9999px rgba(0, 255, 170, 0.42), inset 0 0 0 3px rgba(180, 255, 230, 0.98)';
      }

      if (piece) {
        const assigned = piece?.specialization ? { specialization: piece.specialization } : null;
        const span = document.createElement('span');
        span.className = `piece ${piece.color === 'white' ? 'white-piece' : 'black-piece'}`;
        span.textContent = getPieceSymbol(piece);
        const frozenFlag = state?.specializedStatusById?.[piece.id]?.frozen ? ' — Frozen' : '';
        span.title = assigned ? `${getPieceLabel(piece)} — ${assigned.specialization}${frozenFlag}` : `${getPieceLabel(piece)}${frozenFlag}`;
        square.appendChild(span);

        const customMarker = piece?.customMarker ? abbreviateSandboxMarker(piece.customMarker) : '';

        if (assigned || customMarker) {
          const marker = document.createElement('span');
          marker.textContent = customMarker || specializationMarkerLabel(assigned.specialization);
          marker.style.position = 'absolute';
          marker.style.top = '4px';
          marker.style.right = '4px';
          marker.style.fontSize = '12px';
          marker.style.fontWeight = '800';
          marker.style.padding = '2px 5px';
          marker.style.borderRadius = '999px';
          marker.style.background = customMarker ? 'rgba(35, 79, 35, 0.96)' : 'rgba(0, 0, 0, 0.92)';
          marker.style.color = '#fff';
          if (customMarker && piece.customMarker) { span.title = `${getPieceLabel(piece)} — marker: ${piece.customMarker}`; }
          marker.style.zIndex = '2';
          marker.style.pointerEvents = 'none';
          square.appendChild(marker);
        }
      }

      if (visualColIndex === 0) {
        const rank = document.createElement('span');
        rank.textContent = String(8 - rowIndex);
        rank.style.position = 'absolute';
        rank.style.left = '4px';
        rank.style.top = '4px';
        rank.style.fontSize = '13px';
        rank.style.fontWeight = '700';
        rank.style.opacity = '1';
        rank.style.color = ((rowIndex + colIndex) % 2 === 0) ? '#4a2f13' : '#fff6d8';
        rank.style.pointerEvents = 'none';
        square.appendChild(rank);
      }

      if (visualRowIndex === displayRows.length - 1) {
        const file = document.createElement('span');
        file.textContent = 'abcdefgh'[colIndex];
        file.style.position = 'absolute';
        file.style.right = '4px';
        file.style.bottom = '4px';
        file.style.fontSize = '13px';
        file.style.fontWeight = '700';
        file.style.opacity = '1';
        file.style.color = ((rowIndex + colIndex) % 2 === 0) ? '#4a2f13' : '#fff6d8';
        file.style.pointerEvents = 'none';
        square.appendChild(file);
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

  if (state.aiThinking) {
    statusEl.textContent = 'Human vs AI | AI is thinking...';
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
  const rulesetBit = state.isSandbox ? ' | Ruleset: Sandbox' : state.isSpecialized ? ' | Ruleset: Specialized' : ' | Ruleset: Normal';
  const extra = state.statusMessage ? ` | ${state.statusMessage}` : '';
  statusEl.textContent = `Mode: ${modeLabel}${rulesetBit} | Current turn: ${state.currentTurn}${extra}${sessionBit}${readOnlyBit}`;
}

export function renderSpecializedSetup(state, onAssign, onSetupSideChange, onAddAssignmentRow) {
  const wrap = document.getElementById('specializedSetup');
  wrap.innerHTML = '';

  if (!state.isSpecialized || state.started) {
    wrap.innerHTML = '<div class="item-meta">Turn on Specialized ruleset before game start to configure assignments.</div>';
    return;
  }

  const topTabs = document.createElement('div');
  topTabs.className = 'inline-actions';
  ['white', 'black'].forEach(side => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = side === state.specializedSetupSide ? '' : 'secondary';
    btn.textContent = side[0].toUpperCase() + side.slice(1);
    btn.addEventListener('click', () => onSetupSideChange(side));
    topTabs.appendChild(btn);
  });
  wrap.appendChild(topTabs);

  const side = state.specializedSetupSide || 'white';
  const section = document.createElement('div');
  section.className = 'item';
  section.style.marginTop = '10px';

  const title = document.createElement('div');
  title.className = 'item-title';
  const count = (state.specializedAssignments?.[side] || []).filter(Boolean).length;
  title.textContent = `${side.toUpperCase()} assignments (${count})`;
  section.appendChild(title);

  const rows = state.specializedAssignments?.[side] || [null];
  rows.forEach((current, i) => {
    const row = document.createElement('div');
    row.className = 'inline-controls';
    row.style.marginTop = '8px';
    row.style.alignItems = 'center';

    const searchWrap = document.createElement('div');
    searchWrap.style.position = 'relative';
    searchWrap.style.flex = '1';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Specialized piece';
    searchInput.value = current?.specialization || '';

    const dropdown = document.createElement('div');
    dropdown.style.position = 'absolute';
    dropdown.style.top = '100%';
    dropdown.style.left = '0';
    dropdown.style.right = '0';
    dropdown.style.background = '#fff';
    dropdown.style.color = '#111';
    dropdown.style.borderRadius = '10px';
    dropdown.style.marginTop = '4px';
    dropdown.style.maxHeight = '180px';
    dropdown.style.overflow = 'auto';
    dropdown.style.zIndex = '20';
    dropdown.style.display = 'none';
    dropdown.style.boxShadow = '0 10px 24px rgba(0,0,0,0.28)';

    function renderSearchOptions() {
      const query = (searchInput.value || '').trim().toLowerCase();
      dropdown.innerHTML = '';
      let count = 0;
      Object.entries(SPECIALIZED_CATALOG).forEach(([pieceType, names]) => {
        names.forEach(name => {
          if (query && !name.toLowerCase().includes(query)) return;
          const item = document.createElement('button');
          item.type = 'button';
          item.className = 'secondary';
          item.style.width = '100%';
          item.style.textAlign = 'left';
          item.style.borderRadius = '0';
          item.style.background = 'transparent';
          item.style.color = '#111';
          item.textContent = name;
          item.addEventListener('click', () => {
            searchInput.value = name;
            dropdown.style.display = 'none';
            onAssign(side, i, { pieceType, specialization: name, square: current?.square || '' });
          });
          dropdown.appendChild(item);
          count += 1;
        });
      });
      dropdown.style.display = count ? 'block' : 'none';
    }

    searchInput.addEventListener('focus', renderSearchOptions);
    searchInput.addEventListener('input', renderSearchOptions);
    searchInput.addEventListener('blur', () => setTimeout(() => { dropdown.style.display = 'none'; }, 120));

    searchWrap.appendChild(searchInput);
    searchWrap.appendChild(dropdown);

    const arrow = document.createElement('div');
    arrow.className = 'item-meta';
    arrow.textContent = '→';
    arrow.style.padding = '0 4px';

    const pieceSelect = document.createElement('select');
    pieceSelect.style.flex = '1';
    const pieceEmpty = document.createElement('option');
    pieceEmpty.value = '';
    pieceEmpty.textContent = 'Assigned piece';
    pieceSelect.appendChild(pieceEmpty);

    const selectedType = current?.pieceType || null;
    if (selectedType) {
      (SPECIALIZED_STARTING_SQUARES[side][selectedType] || []).forEach(square => {
        const opt = document.createElement('option');
        opt.value = square;
        opt.textContent = friendlySquareLabel(side, selectedType, square);
        if (current?.square === square) {
          opt.selected = true;
        }
        pieceSelect.appendChild(opt);
      });
    }

    pieceSelect.addEventListener('change', () => {
      if (!current?.pieceType || !current?.specialization) return;
      onAssign(side, i, {
        pieceType: current.pieceType,
        specialization: current.specialization,
        square: pieceSelect.value,
      });
    });

    row.appendChild(searchWrap);
    row.appendChild(arrow);
    row.appendChild(pieceSelect);
    section.appendChild(row);
  });

  const addButton = document.createElement('button');
  addButton.type = 'button';
  addButton.className = 'secondary';
  addButton.style.marginTop = '10px';
  addButton.textContent = '+ Add row';
  addButton.addEventListener('click', () => onAddAssignmentRow(side));
  section.appendChild(addButton);

  wrap.appendChild(section);
}

export function renderSandboxControls(state, handlers) {
  const section = document.getElementById('sandboxSection');
  const status = document.getElementById('sandboxStatus');
  const summonColor = document.getElementById('sandboxSummonColor');
  const summonType = document.getElementById('sandboxSummonType');
  const summonButton = document.getElementById('sandboxSummonButton');
  const deleteButton = document.getElementById('sandboxDeleteButton');
  const undoButton = document.getElementById('sandboxUndoButton');
  const markerInput = document.getElementById('sandboxMarkerInput');
  const applyMarkerButton = document.getElementById('sandboxApplyMarkerButton');
  const clearMarkerButton = document.getElementById('sandboxClearMarkerButton');
  const aiWhiteButton = document.getElementById('sandboxAskAiWhiteButton');
  const aiBlackButton = document.getElementById('sandboxAskAiBlackButton');

  if (!section || !status || !summonColor || !summonType || !summonButton || !deleteButton || !undoButton || !markerInput || !applyMarkerButton || !clearMarkerButton || !aiWhiteButton || !aiBlackButton) return;

  section.style.display = state.isSandbox ? 'block' : 'none';
  if (!state.isSandbox) return;

  summonType.innerHTML = '';
  sandboxPieceTypes().forEach(type => {
    const opt = document.createElement('option');
    opt.value = type;
    opt.textContent = type;
    summonType.appendChild(opt);
  });

  const selected = state.selectedSquare ? `${'abcdefgh'[state.selectedSquare.col]}${8 - state.selectedSquare.row}` : 'none';
  status.textContent = `Selected square: ${selected}. Click any piece, then any square to move it freely.`;

  summonButton.onclick = () => handlers.onSandboxSummon(summonColor.value, summonType.value);
  deleteButton.onclick = () => handlers.onSandboxDelete();
  undoButton.onclick = () => handlers.onSandboxUndo();
  applyMarkerButton.onclick = () => handlers.onSandboxApplyMarker(markerInput.value);
  clearMarkerButton.onclick = () => handlers.onSandboxClearMarker();
  aiWhiteButton.onclick = () => handlers.onSandboxAskAi('white');
  aiBlackButton.onclick = () => handlers.onSandboxAskAi('black');

  const showAi = state.mode === 'human-vs-ai' ? 'inline-block' : 'none';
  aiWhiteButton.style.display = showAi;
  aiBlackButton.style.display = showAi;
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
  replayStatus.textContent = disabled ? 'Load a saved session to replay moves.' : state.replayBoard ? `Replay step ${state.replayIndex}/${state.replayStates.length - 1}` : 'Live board view';
}

export function bindControls({ onReset, onModeChange, onPlayerColorChange, onStart, onLogin, onLogout, onCreateSession, onReplayStart, onReplayPrev, onReplayNext, onReplayEnd, onRulesetChange }) {
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
  document.getElementById('rulesetNormalToggle').addEventListener('change', () => onRulesetChange('normal'));
  document.getElementById('rulesetSpecializedToggle').addEventListener('change', () => onRulesetChange('specialized'));
  document.getElementById('rulesetSandboxToggle').addEventListener('change', () => onRulesetChange('sandbox'));
}

export function renderAuth(user, error = '') {
  const loginForm = document.getElementById('loginForm');
  const userPanel = document.getElementById('userPanel');
  const authState = document.getElementById('authState');
  const currentUser = document.getElementById('currentUser');
  const loginError = document.getElementById('loginError');
  const createArea = document.getElementById('sessionCreateArea');
  const createHint = document.getElementById('sessionCreateHint');

  if (user) {
    loginForm.style.display = 'none';
    userPanel.style.display = 'block';
    authState.textContent = 'Authenticated';
    currentUser.textContent = `${user.displayName} (@${user.username})`;
    loginError.textContent = '';
    createArea.style.display = 'flex';
    createHint.style.display = 'none';
  } else {
    loginForm.style.display = 'flex';
    userPanel.style.display = 'none';
    authState.textContent = 'Please log in';
    currentUser.textContent = '';
    loginError.textContent = error;
    createArea.style.display = 'none';
    createHint.style.display = 'block';
  }
}

function sessionResultLabel(session) {
  if (session.result === 'white-win') return 'White won';
  if (session.result === 'black-win') return 'Black won';
  if (session.result === 'draw') return 'Draw';
  return 'In progress';
}

export function renderSessions(sessions, onOpenSession, onDeleteSession, onRenameSession) {
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
      title.textContent = session.name || `Session ${String(session.id).slice(0, 8)}`;
      const meta = document.createElement('div');
      meta.className = 'item-meta';
      const userSide = session.white_user_id ? 'White' : session.black_user_id ? 'Black' : '-';
      const ruleset = session.ruleset === 'specialized' ? 'Specialized' : session.ruleset === 'sandbox' ? 'Sandbox' : 'Normal';
      meta.textContent = `You play: ${userSide} | Ruleset: ${ruleset} | Result: ${sessionResultLabel(session)} | Updated: ${new Date(session.updated_at).toLocaleString()}`;
      const actions = document.createElement('div');
      actions.className = 'inline-actions';
      const openButton = document.createElement('button');
      openButton.className = 'secondary';
      openButton.textContent = session.status === 'finished' ? 'View / Replay' : 'Open';
      openButton.addEventListener('click', () => onOpenSession(session.id));
      const renameButton = document.createElement('button');
      renameButton.className = 'secondary';
      renameButton.textContent = 'Rename';
      renameButton.addEventListener('click', () => onRenameSession(session));
      const deleteButton = document.createElement('button');
      deleteButton.className = 'danger';
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', () => onDeleteSession(session));
      actions.appendChild(openButton);
      actions.appendChild(renameButton);
      actions.appendChild(deleteButton);
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
  document.getElementById('rulesetNormalToggle').checked = !state.isSpecialized && !state.isSandbox;
  document.getElementById('rulesetSpecializedToggle').checked = Boolean(state.isSpecialized);
  document.getElementById('rulesetSandboxToggle').checked = Boolean(state.isSandbox);
  document.getElementById('newSessionSpecializedToggle').checked = Boolean(state.isSpecialized);
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
    name: document.getElementById('newSessionNameInput').value.trim(),
    specialized: document.getElementById('newSessionSpecializedToggle').checked,
  };
}
