function toUciCoord(row, col) {
  const files = 'abcdefgh';
  return `${files[col]}${8 - row}`;
}

function fromUciCoord(coord) {
  const files = 'abcdefgh';
  return {
    row: 8 - Number(coord[1]),
    col: files.indexOf(coord[0]),
  };
}

function pieceToFenChar(piece) {
  const map = {
    pawn: 'p',
    knight: 'n',
    bishop: 'b',
    rook: 'r',
    queen: 'q',
    king: 'k',
  };
  const ch = map[piece.type];
  return piece.color === 'white' ? ch.toUpperCase() : ch;
}

function boardToFen(board) {
  return board.map(row => {
    let out = '';
    let empty = 0;
    row.forEach(piece => {
      if (!piece) {
        empty += 1;
      } else {
        if (empty) {
          out += String(empty);
          empty = 0;
        }
        out += pieceToFenChar(piece);
      }
    });
    if (empty) out += String(empty);
    return out;
  }).join('/');
}

function castlingToFen(castlingRights) {
  const flags = [];
  if (castlingRights.white.kingSide) flags.push('K');
  if (castlingRights.white.queenSide) flags.push('Q');
  if (castlingRights.black.kingSide) flags.push('k');
  if (castlingRights.black.queenSide) flags.push('q');
  return flags.length ? flags.join('') : '-';
}

function enPassantToFen(target) {
  return target ? toUciCoord(target.row, target.col) : '-';
}

export function buildFen(state) {
  const board = boardToFen(state.board);
  const side = state.currentTurn === 'white' ? 'w' : 'b';
  const castling = castlingToFen(state.castlingRights);
  const ep = enPassantToFen(state.enPassantTarget);
  const halfmove = state.halfmoveClock || 0;
  const fullmove = state.fullmoveNumber || 1;
  return `${board} ${side} ${castling} ${ep} ${halfmove} ${fullmove}`;
}

export function createEngine() {
  const worker = new Worker('./vendor/stockfish/stockfish-nnue-16-single.js');
  let ready = false;
  let booting = false;
  let pendingReadyResolvers = [];

  function handleReadyMessage(text) {
    if (text === 'readyok') {
      ready = true;
      booting = false;
      pendingReadyResolvers.forEach(resolve => resolve());
      pendingReadyResolvers = [];
    }
  }

  worker.onmessage = event => {
    const text = typeof event.data === 'string' ? event.data : '';
    if (!text) return;
    handleReadyMessage(text);
  };

  function ensureReady() {
    if (ready) return Promise.resolve();
    if (!booting) {
      booting = true;
      worker.postMessage('uci');
      worker.postMessage('isready');
    }
    return new Promise(resolve => {
      pendingReadyResolvers.push(resolve);
    });
  }

  async function getBestMove(state, { depth = 10 } = {}) {
    await ensureReady();
    return new Promise((resolve, reject) => {
      const fen = buildFen(state);
      const timeout = setTimeout(() => {
        worker.onmessage = baseHandler;
        reject(new Error('Stockfish timed out'));
      }, 20000);

      function baseHandler(event) {
        const text = typeof event.data === 'string' ? event.data : '';
        if (!text) return;
        handleReadyMessage(text);
      }

      worker.onmessage = event => {
        const text = typeof event.data === 'string' ? event.data : '';
        if (!text) return;
        handleReadyMessage(text);
        if (text.startsWith('bestmove')) {
          clearTimeout(timeout);
          worker.onmessage = baseHandler;
          const parts = text.split(' ');
          const move = parts[1];
          if (!move || move === '(none)') {
            resolve(null);
            return;
          }
          const from = fromUciCoord(move.slice(0, 2));
          const to = fromUciCoord(move.slice(2, 4));
          const promotion = move.length > 4 ? move[4] : null;
          resolve({ from, to, promotion });
        }
      };

      worker.postMessage(`position fen ${fen}`);
      worker.postMessage(`go depth ${depth}`);
    });
  }

  return { getBestMove };
}
