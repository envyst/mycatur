# Mycatur Backend / Persistence Plan

## New direction
`mycatur` is no longer only a static frontend. It now moves toward a Node.js + Express + PostgreSQL app.

## Why
Needed for:
- login
- saved game sessions
- resume unfinished sessions
- historical finished sessions
- PGN-grade move history persistence

## Current backend data model
### users
- id
- username
- password_hash
- display_name
- created_at

### game_sessions
- id
- white_user_id
- black_user_id
- mode
- status
- result
- current_turn
- latest board state json
- castling rights json
- en passant target json
- halfmove clock
- fullmove number
- position history json
- pgn_text
- winner_user_id
- timestamps

### game_moves
- per-move stored history
- SAN/PGN-oriented notation field
- snapshot-after-move field for audit/debug/replay help

## Seeded default users
Two default users are seeded at startup if absent:
- `envyst`
- `absol`

Passwords are generated into `.env` on this host and should be shared to the user directly after deployment.
