# Mycatur Game V2

Structured rebuild area for the `mycatur` chess project.

## Current status
This is the new modular base for the game.

Current goals:
- normal chess should work first
- human vs human should work first
- human vs engine should work in a lightweight placeholder way first
- special pieces currently only affect naming/theme
- no special powers are active yet

## Current structure
- `index.html` — app shell and current basic styling
- `src/config.js` — constants, modes, and theme options
- `src/pieces.js` — piece symbols and specialized labels
- `src/state.js` — initial state / starting board
- `src/board.js` — movement helpers and board logic
- `src/game.js` — gameplay flow and interaction handling
- `src/ui.js` — DOM rendering and controls
- `src/main.js` — startup entrypoint
- `docs/ARCHITECTURE.md` — current architecture/intent note

## Current working direction
The current implementation is intentionally simplified:
- standard chess movement only
- no power system
- no special piece abilities
- engine mode currently uses a simple placeholder random move loop until Stockfish is integrated

## How to open
At minimum, this can be opened as a static HTML app.

For local development, use a simple local server:

```bash
cd /root/.openclaw/project/mycatur
python3 -m http.server 8000
```

Then open:
- `http://127.0.0.1:8000/game-v2/`

## Deploy direction
This directory is intended to be containerized and served behind nginx later on `mycatur.envyst.asia`.
