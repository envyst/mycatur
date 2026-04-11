# Gunslinger

## Corrected rule
If this and an enemy piece threaten each other for a full turn, you may spend a turn to destroy the enemy piece.

## Current implementation
- base movement: bishop
- mutual threat with a non-king enemy piece is tracked
- if the mutual threat persists for a full turn, Gunslinger becomes armed against that target
- while the mutual threat continues, the armed state persists
- double-tap Gunslinger to spend the turn and destroy only the enemy piece
- Gunslinger remains alive
