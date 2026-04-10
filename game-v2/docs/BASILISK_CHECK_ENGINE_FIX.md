# Basilisk Check Engine Fix

## Purpose
Fix Basilisk more fundamentally by making attack/check evaluation use the full specialized game state instead of partial/special-cased shortcuts.

## Changes
- `isSquareAttacked(...)` now ignores Basilisk-paralyzed attackers for all piece types, not just selective special cases
- specialized state such as `specializedStatusById` and `lastMovedPieceIdByColor` now flows into attack evaluation where needed
- `isKingInCheck(...)` now accepts and uses full game state
- king-safety legal move filtering now checks post-move king safety with the provided specialized game state path

## Goal
Make Basilisk-paralyzed attackers stop counting as check sources and allow Basilisk moves that paralyze the checking piece to resolve check legally.
