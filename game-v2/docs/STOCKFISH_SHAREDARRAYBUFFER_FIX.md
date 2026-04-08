# Mycatur Stockfish SharedArrayBuffer Fix

## Issue
The previous Stockfish browser build expected `SharedArrayBuffer`, which was unavailable in the current page environment.

## Fix applied
Switched the browser worker integration to the non-SharedArrayBuffer Stockfish build:
- `stockfish-nnue-16-no-Worker.js`
- `stockfish-nnue-16-no-Worker.wasm`

## Why
This is more compatible with the current deployment/browser environment and should allow the AI move path to execute instead of dying at worker startup.
