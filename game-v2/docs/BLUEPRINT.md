# Blueprint

## Source rule
Blueprint (pawn) = At the start of the game, transform into the pawn to its left.

## Current implementation
- Blueprint resolves once at game start
- it checks the piece immediately to its left
- if that left piece has a specialization, Blueprint copies that specialization
- if the left piece is normal or absent, Blueprint becomes a normal pawn and loses its marker
