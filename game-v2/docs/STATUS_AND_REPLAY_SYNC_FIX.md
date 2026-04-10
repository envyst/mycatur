# Status and Replay Sync Fix

## Fixes
- status/check evaluation now passes full game state into `isKingInCheck(...)` so UI status is consistent with specialized-aware legality
- replay snapshots now carry more state context and replay navigation uses a common jump path for cleaner board/status syncing

## Goal
Reduce mismatches where the board behaves correctly but the status line or replay navigation shows stale or inconsistent state.
