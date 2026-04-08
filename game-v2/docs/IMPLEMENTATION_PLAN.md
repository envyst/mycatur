# Mycatur game-v2 — Implementation Plan

## Goal
Make `game-v2` a proper normal chess game first before revisiting any custom/specialized mechanics or future UI redesigns.

## Phase 1 — simplify scope
- remove specialized piece assignment/setup from active UI
- remove specialized naming/theme dependence from active logic
- keep only normal chess concepts in current baseline

## Phase 2 — complete chess rules
Implement and validate:
- legal move generation with self-check prevention
- check detection
- checkmate detection
- stalemate detection
- castling rules
- en passant rules
- pawn promotion rules and UI
- draw rules as needed (at least obvious no-move/end-state handling first)

## Phase 3 — improve engine boundary
- keep human vs human stable
- keep human vs engine boundary clean
- replace temporary random-move placeholder with real engine integration later
- likely Stockfish later, but not before normal chess rules are reliable

## Phase 4 — UI redesign later
After rules are stable:
- user may provide a target image/reference
- update visual design to match desired style
- do not let visual redesign disrupt rules correctness

## Handover notes
If another agent/person continues this work, they should treat the current priority order as:
1. full normal chess correctness
2. stable playable UX
3. engine integration
4. future custom piece mechanics
5. future UI redesign based on user-provided image reference
