# Pinata

## Corrected rule
Pinata transforms at game start into a truly random specialized piece, excluding:
- Pinata itself
- pawn-type specialized pieces

## Current implementation
- transformation happens at game start before play
- each Pinata rolls independently
- same square, piece id, and color remain; only specialization changes
