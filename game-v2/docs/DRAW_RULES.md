# Mycatur game-v2 — Draw Rules

## Added in this pass
Draw handling was extended beyond stalemate / insufficient material.

### Implemented
- position key generation from:
  - board layout
  - side to move
  - castling rights
  - en passant target
- in-memory position history counting
- automatic threefold repetition detection
- halfmove clock tracking
- automatic fifty-move rule detection

## Current draw coverage
- stalemate
- insufficient material (basic heuristic)
- threefold repetition
- fifty-move rule

## Current implementation notes
- draw tracking is in-memory only
- no PostgreSQL is needed for this rules layer
- deployment stack remains unchanged

## Still not covered
- formal claim workflow versus automatic adjudication
- richer notation / PGN-style record keeping
- persistent saved-game state across refresh/restart
