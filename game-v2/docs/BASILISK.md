# Basilisk

## Confirmed rule
- base movement: bishop
- cannot capture
- any enemy piece it attacks cannot move at all
- this includes kings
- if a king is paralyzed by Basilisk and attacked by another piece with no escape/block, that can result in checkmate
- if two Basilisks attack each other, they paralyze each other

## Current implementation direction
Implemented as:
- bishop movement base
- no capture permission
- paralysis effect enforced during legal move generation for attacked enemy pieces
