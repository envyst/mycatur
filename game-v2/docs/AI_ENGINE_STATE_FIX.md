# Mycatur AI Engine State Fix

## Issue
Some state reset/load flows recreated the game state without carrying forward an engine instance, causing:
- `Cannot read properties of undefined (reading 'getBestMove')`

## Fix applied
- reset/local state creation now always reinitializes the engine instance
- session load path also defensively rehydrates the engine if missing
