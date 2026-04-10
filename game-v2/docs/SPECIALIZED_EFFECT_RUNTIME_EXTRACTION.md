# Specialized Effect Runtime Extraction

## Purpose
Continue the specialized subsystem refactor by moving effect definitions and runtime helpers into the new `src/specialized/` module tree.

## New modules
- `src/specialized/definitions.js` -> piece effect definitions / rule flags
- `src/specialized/runtime.js` -> runtime effect helpers used by board/game logic
- `src/specialized/effects.js` -> barrel export for specialized definitions + runtime helpers

## Compatibility
- legacy `src/specialized-effects.js` now acts as a thin compatibility re-export only

## Goal
Reduce the old monolithic specialized-effects file to a stable compatibility shim and make future specialized work more structured.
