# Icicle Double Count Fix

## Issue
Icicle freeze progression was being advanced twice in a normal move flow:
- once immediately inside `makeMove()`
- again during `finalizeTurn()`

## Result
Pieces could freeze effectively one turn too early, appearing to freeze instantly.

## Fix
Freeze progression now advances only on the actual turn-finalization path.
