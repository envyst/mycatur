# Specialized Subsystem Refactor

## Purpose
Begin separating the specialized-piece system into a cleaner internal module structure before the piece count and rule complexity grow further.

## New structure
- `src/specialized/catalog.js` -> assignable piece catalog, starting squares, labels, marker helpers
- `src/specialized/assignments.js` -> assignment-state helpers and square mapping
- `src/specialized/effects.js` -> effect-layer re-export entry point
- `src/specialized/index.js` -> specialized subsystem barrel

## Compatibility
- existing runtime effect logic still currently lives in `src/specialized-effects.js`
- this refactor is a safe first-pass extraction and import cleanup, not a full behavior rewrite

## Goal
Create a cleaner base for future specialized-piece work and later deeper extraction of effect/runtime logic.
