import express from 'express';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';
import { seedDefaultUsers } from './seed.js';
import { createInitialGameState } from './chess-state.js';

const app = express();
const PgSession = pgSession(session);
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(session({
  store: new PgSession({
    pool,
    tableName: 'user_sessions',
    createTableIfMissing: false,
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7,
    sameSite: 'lax',
    secure: false,
  },
}));

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.get('/api/health', async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const result = await pool.query(
    'SELECT id, username, password_hash, display_name FROM users WHERE username = $1',
    [username],
  );
  const user = result.rows[0];
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  req.session.user = {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
  };

  res.json({
    user: req.session.user,
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.get('/api/me', (req, res) => {
  res.json({ user: req.session.user || null });
});

app.get('/api/sessions', requireAuth, async (req, res) => {
  const userId = req.session.user.id;
  const result = await pool.query(
    `SELECT id, name, mode, ruleset, status, result, current_turn, pgn_text, updated_at, created_at,
            white_user_id, black_user_id
     FROM game_sessions
     WHERE white_user_id = $1 OR black_user_id = $1
     ORDER BY updated_at DESC`,
    [userId],
  );
  res.json({ sessions: result.rows });
});

app.post('/api/sessions', requireAuth, async (req, res) => {
  const { mode = 'human-vs-human', side = 'white', name = '', ruleset = 'normal' } = req.body || {};
  const userId = req.session.user.id;
  const initial = createInitialGameState(mode);

  const aiMode = mode === 'human-vs-ai';
  const whiteUserId = side === 'white' ? userId : null;
  const blackUserId = side === 'black' ? userId : null;

  const result = await pool.query(
    `INSERT INTO game_sessions (
      name, white_user_id, black_user_id, mode, ruleset, status, result, current_turn,
      board_state_json, castling_rights_json, en_passant_target_json,
      halfmove_clock, fullmove_number, position_history_json, pgn_text
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    RETURNING *`,
    [
      name || null,
      whiteUserId,
      blackUserId,
      initial.mode,
      ruleset,
      initial.status,
      initial.result,
      initial.currentTurn,
      JSON.stringify(initial.board),
      JSON.stringify(initial.castlingRights),
      initial.enPassantTarget ? JSON.stringify(initial.enPassantTarget) : null,
      initial.halfmoveClock,
      initial.fullmoveNumber,
      JSON.stringify(initial.positionHistory),
      initial.pgnText,
    ],
  );

  res.json({ session: result.rows[0] });
});

app.get('/api/sessions/:id', requireAuth, async (req, res) => {
  const userId = req.session.user.id;
  const result = await pool.query(
    `SELECT * FROM game_sessions
     WHERE id = $1 AND (white_user_id = $2 OR black_user_id = $2)`,
    [req.params.id, userId],
  );
  const sessionRow = result.rows[0];
  if (!sessionRow) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const moves = await pool.query(
    `SELECT move_index, side, from_square, to_square, piece, promotion_piece, san, board_state_after_json, created_at
     FROM game_moves WHERE session_id = $1 ORDER BY move_index ASC`,
    [req.params.id],
  );

  res.json({ session: sessionRow, moves: moves.rows });
});

app.put('/api/sessions/:id', requireAuth, async (req, res) => {
  const userId = req.session.user.id;
  const {
    name,
    ruleset,
    status,
    result,
    currentTurn,
    board,
    castlingRights,
    enPassantTarget,
    halfmoveClock,
    fullmoveNumber,
    positionHistory,
    pgnText,
    move,
  } = req.body || {};

  const existing = await pool.query(
    `SELECT * FROM game_sessions WHERE id = $1 AND (white_user_id = $2 OR black_user_id = $2)`,
    [req.params.id, userId],
  );
  const sessionRow = existing.rows[0];
  if (!sessionRow) {
    return res.status(404).json({ error: 'Session not found' });
  }
  if (sessionRow.status === 'finished') {
    return res.status(400).json({ error: 'Finished sessions cannot be resumed for play' });
  }

  const updated = await pool.query(
    `UPDATE game_sessions SET
      name = COALESCE($2, name),
      ruleset = COALESCE($3, ruleset),
      status = $4,
      result = $5,
      current_turn = $6,
      board_state_json = $7,
      castling_rights_json = $8,
      en_passant_target_json = $9,
      halfmove_clock = $10,
      fullmove_number = $11,
      position_history_json = $12,
      pgn_text = $13,
      updated_at = NOW(),
      finished_at = CASE WHEN $4 = 'finished' THEN NOW() ELSE NULL END
     WHERE id = $1
     RETURNING *`,
    [
      req.params.id,
      name || null,
      ruleset || null,
      status,
      result,
      currentTurn,
      JSON.stringify(board),
      JSON.stringify(castlingRights),
      enPassantTarget ? JSON.stringify(enPassantTarget) : null,
      halfmoveClock,
      fullmoveNumber,
      JSON.stringify(positionHistory || {}),
      pgnText || '',
    ],
  );

  if (move) {
    await pool.query(
      `INSERT INTO game_moves (session_id, move_index, side, from_square, to_square, piece, promotion_piece, san, board_state_after_json)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (session_id, move_index) DO NOTHING`,
      [
        req.params.id,
        move.moveIndex,
        move.side,
        move.fromSquare,
        move.toSquare,
        move.piece,
        move.promotionPiece || null,
        move.san,
        JSON.stringify(board),
      ],
    );
  }

  res.json({ session: updated.rows[0] });
});


app.delete('/api/sessions/:id', requireAuth, async (req, res) => {
  const userId = req.session.user.id;
  await pool.query(
    `DELETE FROM game_sessions WHERE id = $1 AND (white_user_id = $2 OR black_user_id = $2)`,
    [req.params.id, userId],
  );
  res.json({ ok: true });
});

app.use(express.static('game-v2'));
app.get('*', (_req, res) => {
  res.sendFile(new URL('../../game-v2/index.html', import.meta.url).pathname);
});



async function runMigrations() {
  await pool.query(`ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS name TEXT`);
  await pool.query(`ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS ruleset TEXT NOT NULL DEFAULT 'normal'`);
}

async function start() {
  await pool.query('SELECT 1');
  await runMigrations();
  await seedDefaultUsers();
  app.listen(PORT, () => {
    console.log(`mycatur app listening on :${PORT}`);
  });
}

start().catch(err => {
  console.error(err);
  process.exit(1);
});
