CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  white_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  black_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  mode TEXT NOT NULL,
  status TEXT NOT NULL,
  result TEXT,
  current_turn TEXT NOT NULL,
  board_state_json JSONB NOT NULL,
  castling_rights_json JSONB NOT NULL,
  en_passant_target_json JSONB,
  halfmove_clock INTEGER NOT NULL DEFAULT 0,
  fullmove_number INTEGER NOT NULL DEFAULT 1,
  position_history_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  pgn_text TEXT NOT NULL DEFAULT '',
  winner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS game_moves (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  move_index INTEGER NOT NULL,
  side TEXT NOT NULL,
  from_square TEXT,
  to_square TEXT,
  piece TEXT,
  promotion_piece TEXT,
  san TEXT NOT NULL,
  board_state_after_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, move_index)
);

CREATE TABLE IF NOT EXISTS user_sessions (
  sid varchar NOT NULL PRIMARY KEY,
  sess json NOT NULL,
  expire timestamp(6) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expire ON user_sessions (expire);
