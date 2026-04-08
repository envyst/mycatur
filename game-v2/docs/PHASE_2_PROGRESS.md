# Mycatur game-v2 — Phase 2 Progress

## Scope of this phase
Add manual support for the next normal-chess rule layer:
- castling
- en passant
- promotion

## Implemented in current pass
- added castling rights into game state
- added en passant target tracking into game state
- added pending promotion state
- extended board move application to support:
  - castling rook movement
  - en passant capture removal
  - promotion detection
- extended king legal-move filtering to reject castling through check
- added simple promotion UI with choices:
  - queen
  - rook
  - bishop
  - knight
- engine placeholder auto-promotes to queen for now

## Important note
This is still a manual/custom rules core, not Stockfish-driven rules handling.
That is intentional so the project can later evolve toward custom/specialized rule support without giving rule authority to Stockfish.

## Remaining validation need
This phase still needs hands-on gameplay validation from real move sequences to confirm edge cases are correct.
