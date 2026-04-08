# Checkpoint: Sandbox and Basilisk

## Summary
This checkpoint captures two major lines of work on top of the stable normal-chess baseline:

1. Specialized mode progress
   - visibility/marker improvements
   - piece-bound specialization with stable piece IDs
   - completed Iron Pawn behavior
   - Basilisk implemented and corrected

2. Sandbox mode introduction
   - sandbox ruleset visible in UI
   - free board editing
   - summon / delete / undo controls
   - on-demand AI requests
   - explicit side-targeted AI buttons: white / black

## Deployment flow
Use the existing deploy flow under `game-v2/ops/Makefile`:
- `make -f game-v2/ops/Makefile help`
- `make -f game-v2/ops/Makefile deploy`
- `make -f game-v2/ops/Makefile health`

## Intent
Preserve the operational path while marking the app state after:
- Iron Pawn correctness
- Basilisk correctness
- first usable sandbox mode
