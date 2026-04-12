# Golden Pawn

## Corrected rule
Golden Pawn (pawn) = When it reaches the last rank, it directly kills the enemy king instead of using normal promotion flow.

## Current implementation
- Golden Pawn does not use normal promotion flow
- on reaching the last rank, the enemy king is removed from the board
- win detection now also checks king presence on board:
  - if only one side's king remains, that side wins
