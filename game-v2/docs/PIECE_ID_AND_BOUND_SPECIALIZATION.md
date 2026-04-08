# Piece ID and Bound Specialization

## New runtime model
Specialized assignments are still chosen by starting square in setup, but after game start the specialization is bound to the actual piece object.

## Piece identity
Each starting piece now has a stable canonical id, for example:
- `w-pawn-d2`
- `b-knight-g8`

## Why
This prevents specialization markers/effects from staying on a board square after the original piece moves away.
The specialization now travels with the piece itself.

## Iron Pawn impact
Iron Pawn effect lookup now reads from the moving/target piece object rather than from current-square assignment mapping.
