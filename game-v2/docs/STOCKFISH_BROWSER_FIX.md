# Mycatur Stockfish Browser Fix

## Issue
Browser ES modules cannot import the bare npm specifier `stockfish` directly in this deployment style.

## Fix applied
- copied browser-usable Stockfish build files into:
  - `game-v2/vendor/stockfish/stockfish-nnue-16.js`
  - `game-v2/vendor/stockfish/stockfish-nnue-16.wasm`
- switched engine loading to a direct Worker path:
  - `./vendor/stockfish/stockfish-nnue-16.js`

## Why
This avoids bare-module resolution problems in the browser while keeping deployment simple.
