# Epee Pawn

## Source rule
Epee Pawn (pawn) = Can en passant any pawn anywhere on the board.

## Current implementation
- normal pawn movement unchanged
- if an enemy pawn has just double-stepped and is en-passant-eligible, Epee Pawn may capture it without adjacency restriction
- Epee Pawn lands on the normal en-passant destination square behind that pawn

## Example
- white Epee Pawn on `d5`
- black pawn moves `h7 -> h5`
- white Epee Pawn may capture via `d5 -> h6`
