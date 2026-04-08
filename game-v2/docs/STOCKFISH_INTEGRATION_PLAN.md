# Mycatur Stockfish Integration Plan

## Direction chosen
Use browser-side `stockfish.js` first for normal human-vs-AI mode.

## Why
- simpler deployment
- no separate engine daemon/process on the server
- backend remains focused on users, sessions, and persistence
- good fit for standard chess mode

## Current first implementation
- frontend `engine.js` wrapper added
- current game state converted to FEN
- engine asked for `bestmove`
- human-vs-ai mode now targets Stockfish instead of placeholder random play

## Important note
This Stockfish path is for standard chess mode only.
Future custom/specialized rules will still require our own rules engine and likely a different custom AI path later.
