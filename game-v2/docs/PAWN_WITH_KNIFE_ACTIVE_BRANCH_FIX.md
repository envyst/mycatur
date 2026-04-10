# Pawn with Knife Active Branch Fix

## Issue
The intended extended inward capture logic was not actually present in the active pawn move-generation branch, so the effect never appeared in legal moves.

## Fix
Added the blocked extended inward diagonal capture logic into the real active pawn capture path.
