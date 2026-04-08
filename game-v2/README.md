# Mycatur Game V2

Structured active app area for the `mycatur` chess project.

## Current implemented directions
- normal chess baseline
- specialized ruleset work (including Iron Pawn and Basilisk)
- sandbox mode with free board editing and on-demand AI requests by side

## Important structure
- `index.html` — app shell and UI layout
- `src/config.js` — constants and mode names
- `src/pieces.js` — piece types and symbols
- `src/state.js` — initial board and game state
- `src/board.js` — movement helpers and board logic
- `src/game.js` — gameplay flow and interaction handling
- `src/ui.js` — DOM rendering and controls
- `src/main.js` — startup entrypoint
- `ops/docker-compose.yml` — deployment compose file
- `ops/Makefile` — local deploy/help commands
- `docs/` — implementation notes and checkpoints

## Running / deploying
From repo root:

```bash
cd /root/.openclaw/project/mycatur
make -f game-v2/ops/Makefile help
```

Useful commands:
- `make -f game-v2/ops/Makefile deploy`
- `make -f game-v2/ops/Makefile ps`
- `make -f game-v2/ops/Makefile logs`
- `make -f game-v2/ops/Makefile health`

## Notes
- Keep active implementation under `game-v2/`
- Root `README.md` remains intentionally minimal
- Do not put the live URL into repo docs outside the allowed rootless chat updates
