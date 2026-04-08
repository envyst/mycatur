# Specialized Effect Engine

## New direction
Specialized pieces are moving toward a metadata-driven rules model instead of one-off hardcoded checks.

## Current structure
- `specialized.js` -> assignment/catalog layer
- `specialized-effects.js` -> effect definitions and runtime rule lookup
- board logic reads specialized rules metadata during move generation / legality checks

## Iron Pawn in this model
Iron Pawn is now defined via metadata-like rules:
- canCapture: false
- canBeCaptured: false
- canPromote: false
- canEnPassantCapture: false

## Why this is better
This creates a scalable foundation for future specialized pieces instead of scattering custom logic everywhere.
