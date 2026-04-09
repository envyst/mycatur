# Promotion Flow Fix

## Issue
Promotion UI could appear, but selecting a promotion piece did not complete the move lifecycle. The promoted piece type changed in memory, but the turn was not finalized, promotion UI remained stuck, and no further moves were possible.

## Fix
- complete SAN update for the promotion move
- clear pending promotion state
- finalize turn after promotion selection
- persist the completed promotion move
- also fixed a separate engine regression where `maybeDoEngineMove()` referenced an undefined `requestedSide`
