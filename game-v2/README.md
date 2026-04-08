# Mycatur Game V2

Structured rebuild area for the `mycatur` chess project.

## Current direction
This app is now focused on one thing first:
- become a correct, playable **normal chess** game

For now:
- no specialized piece mechanics
- no specialized piece setup UI
- no special powers

## Current structure
- `index.html` — app shell and current styling
- `src/config.js` — constants and mode names
- `src/pieces.js` — piece types and symbols
- `src/state.js` — initial board and game state
- `src/board.js` — movement helpers and board logic
- `src/game.js` — gameplay flow and interaction handling
- `src/ui.js` — DOM rendering and controls
- `src/main.js` — startup entrypoint
- `docs/CURRENT_STATE.md` — current state summary
- `docs/IMPLEMENTATION_PLAN.md` — implementation plan
- `docs/HANDOFF.md` — handover notes

## Important status note
The current implementation is a structured baseline, not yet full rules-complete chess.
The next major work is to complete full chess rules correctly before revisiting engine quality or UI redesign.

## Local run
```bash
cd /root/.openclaw/project/mycatur
python3 -m http.server 8000
```

Open:
- `http://127.0.0.1:8000/game-v2/`

## Live site
- `https://mycatur.envyst.asia`
