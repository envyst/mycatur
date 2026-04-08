# Mycatur game-v2 — Handoff

## Repo
- repo path: `/root/.openclaw/project/mycatur`
- live domain: `https://mycatur.envyst.asia`

## Active app area
- `game-v2/`

## Current status summary
A structured replacement area was created under `game-v2/` so work could move away from the old monolithic `index.html`.

The user has now explicitly decided to **set aside specialized pieces and their setup flow for now**.
That means the current product direction is:
- normal chess first
- full rules first
- current UI is acceptable for now
- future UI redesign can happen later after the user sends an image reference

## Files most relevant now
- `game-v2/index.html`
- `game-v2/src/config.js`
- `game-v2/src/pieces.js`
- `game-v2/src/state.js`
- `game-v2/src/board.js`
- `game-v2/src/ui.js`
- `game-v2/src/game.js`
- `game-v2/src/main.js`

## Deployment files
- `Dockerfile`
- `docker-compose.yml`
- `Makefile`
- `deploy/nginx.mycatur.envyst.asia.pre-certbot.conf`

## What is already done operationally
- containerized app is deployed locally behind nginx
- domain resolves correctly
- HTTPS is enabled with certbot
- site is live on `mycatur.envyst.asia`

## Recommended next technical work
1. Refactor/extend `board.js` into full legal chess rules
2. Add full game-state evaluation helpers
3. Add promotion flow
4. Add end-state logic (checkmate/stalemate)
5. Keep engine mode placeholder until normal chess correctness is solid
