# Mycatur Session Name DB Migration Fix

## Issue
Existing PostgreSQL data volumes were created before the `game_sessions.name` column existed, so code that selected `name` caused backend crashes and `502` responses.

## Fix applied
Added a startup migration step in the backend:
- `ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS name TEXT`

## Result
Existing deployments can self-heal this schema gap on app startup without requiring manual DB reset.
