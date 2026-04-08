# game-v2 Architecture

This directory is the new structured implementation area for `mycatur`.

## Current intent
- keep the current UI direction mostly intact for now
- split the old single-file logic into smaller modules
- support human vs human and human vs engine play
- use Stockfish as the engine side later/integration-friendly
- keep specialized pieces only as naming/theme for now
- do **not** implement powers yet

## Immediate goals
1. separate board/game state from UI rendering
2. separate piece metadata from move logic
3. keep normal chess rules as the active ruleset
4. make it easier to add engine and future piece-power logic later

## Current planned structure
- `index.html` — app shell
- `src/config.js` — constants / defaults
- `src/pieces.js` — piece display metadata and specialized names
- `src/state.js` — game state and setup
- `src/board.js` — board helpers and movement core
- `src/game.js` — main gameplay flow
- `src/ui.js` — DOM rendering and interaction
- `src/main.js` — startup wiring

## Important current simplification
Specialized pieces may exist in naming/theme, but their powers are disabled for now.
The active gameplay should behave like normal chess unless explicitly changed later.
