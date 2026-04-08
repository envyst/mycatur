# Mycatur Stockfish Build Variant Switch

## Issue
The previous Stockfish browser build variant still required `SharedArrayBuffer` in this environment.

## Fix attempt applied
Switched the frontend engine worker path to the more compatible single-thread Stockfish build:
- `stockfish-nnue-16-single.js`
- `stockfish-nnue-16-single.wasm`

Also copied the no-simd files into the served vendor directory for fallback investigation if needed.
