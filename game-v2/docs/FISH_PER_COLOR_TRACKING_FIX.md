# Fish Per-Color Tracking Fix

## Issue
Fish bonus movement was tracked using a single global `lastMovedPieceId`, so the white Fish state could be overwritten by Black's move before White's next turn.

## Fix
Track the last moved piece separately for each color.
