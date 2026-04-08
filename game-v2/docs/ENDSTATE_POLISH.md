# Mycatur game-v2 — End-state Polish

## Added in this pass
- explicit draw state flag in game state handling
- clearer stalemate messaging: `Draw by stalemate.`
- basic insufficient-material detection
- draw state now blocks further play in the UI flow

## Current supported end-state layer
- check
- checkmate
- stalemate
- insufficient material (basic heuristic)

## Still not complete
This is still not a full official draw-rule implementation. Not yet covered:
- threefold repetition
- fifty-move rule
- richer notation/history for formal draw claims
