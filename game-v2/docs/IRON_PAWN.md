# Iron Pawn

## Source rule from pixiecheat.txt
- Invulnerable
- can't capture
- can't promote

## Current implementation in specialized mode
Implemented as the first active specialized effect.

### Behavior
- moves forward like a normal pawn
- can still make the opening two-step move if unobstructed
- cannot capture diagonally
- cannot en passant
- cannot be captured by enemy pieces
- cannot promote

## Scope
This effect is only active in `specialized` mode.
Normal chess mode remains unchanged.
