# Gunslinger Import Fix

## Issue
The Gunslinger threat helper in `game.js` used `getPseudoLegalMoves(...)` without importing it from `board.js`, causing a runtime ReferenceError when starting a specialized game.

## Fix
Import `getPseudoLegalMoves` into `game.js`.
