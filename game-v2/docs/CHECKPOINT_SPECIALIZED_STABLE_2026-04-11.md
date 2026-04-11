# Macro Checkpoint: Specialized Stable State (2026-04-11)

## Purpose
This is a broader rollback-safe checkpoint for the current specialized-mode system after major refactor, UX cleanup, and multiple verified piece implementations/fixes.

## Specialized subsystem status
- specialized subsystem refactor completed into `src/specialized/`
- assignment/catalog/definitions/runtime split is active
- old shim files removed
- current codebase is using the refactored structure for new piece work

## Confirmed stable supporting behavior
- normal mode verified okay
- sandbox mode verified okay
- replay works for local/no-login games
- specialized assignment panel rework is working
- status/check UI sync improved
- frozen-piece and sniped-piece visual states added
- unfreeze UX updated and cleaned

## Specialized pieces currently implemented and considered working
- Iron Pawn
- Basilisk
- Anti Violence
- Aristocat
- Icicle
- Cardinal
- Phase Rook
- Camel
- Pawn with Knife
- Fish
- Hero Pawn
- Blueprint
- Epee Pawn
- Bouncer
- Marauder
- Gunslinger
- Dancer

## Notes
This checkpoint is intended as a practical rollback target if future specialized-piece work destabilizes the rules engine or UI interactions.
