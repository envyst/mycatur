# Basilisk Legal Move State Fix

## Problem
The active `getLegalMoves()` path still checked king safety against simulated post-move boards without rebuilding a specialized-aware derived state for those hypothetical positions.

## Fix
- add/use `buildDerivedSpecializedState(...)`
- use derived specialized state for:
  - current-board king-in-check castling checks
  - post-move king safety validation

## Goal
Allow Basilisk-induced paralysis on the hypothetical post-move board to affect legal check resolution correctly.
