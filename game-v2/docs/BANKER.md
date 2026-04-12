# Banker

## Rule
Banker (knight) = Whenever this piece captures a pawn, transform one of your pawns into a Golden Pawn.

## Current implementation
- Banker behaves like a normal knight otherwise
- if Banker captures a pawn, the first eligible allied pawn found on the board is transformed into a Golden Pawn
- already-Golden pawns are skipped
- if no allied pawn is available, nothing extra happens

## Selection policy
For now, transformation target selection is deterministic and automatic:
- scan the board from top-left to bottom-right
- choose the first allied non-Golden pawn found
