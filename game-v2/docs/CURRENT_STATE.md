# Mycatur game-v2 — Current State

## Current focus
`game-v2` is now explicitly focused on becoming a complete **normal chess** implementation first.

## What was removed from current direction
The earlier temporary setup for assigning specialized piece labels/themes has been removed from active scope for now.

Current rule for `game-v2`:
- no specialized piece powers
- no specialized setup flow
- no piece-theme assignment UI
- normal chess only

## What currently exists
- modular split frontend under `game-v2/src/`
- playable board UI
- human vs human mode
- placeholder human vs engine mode
- move log
- Docker + nginx deployment path already working live

## Important honesty note
The current game is **not yet full rules-complete chess**.

It currently has standard movement foundations, but still needs a proper full-rules pass.
Likely missing or incomplete areas include:
- check detection
- checkmate detection
- stalemate detection
- castling
- en passant
- promotion UX + rules
- draw rules
- proper engine integration (later)

## Deployment status
Live site currently served at:
- `https://mycatur.envyst.asia`

Repo deployment assets already present:
- `Dockerfile`
- `docker-compose.yml`
- `Makefile`
- `deploy/nginx.mycatur.envyst.asia.pre-certbot.conf`
