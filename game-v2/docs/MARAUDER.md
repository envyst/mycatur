# Marauder

## Source rule
Marauder (bishop) = Moves like a king at first. Each time it captures a piece, its range increases by 2.

## Current implementation
- starts with 1-step king-like movement range in all 8 directions
- after each capture, movement/capture range increases by 2
- range growth is tracked per Marauder piece id
