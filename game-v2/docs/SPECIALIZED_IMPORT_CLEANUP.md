# Specialized Import Cleanup

## Change
Continue the specialized subsystem refactor by removing direct runtime imports from the old `src/specialized-effects.js` compatibility shim where possible.

## Current cleanup
- `board.js` now imports directly from `src/specialized/effects.js`

## Remaining compatibility shims
- `src/specialized-effects.js`
- `src/specialized.js`

These remain temporarily for safer staged cleanup.
