# Hero Pawn

## Source rule
Hero Pawn (pawn) = If this pawn checks the enemy king, immediately promote.

## Current implementation
- base pawn behavior unchanged
- if a Hero Pawn move causes enemy king to be in check, it immediately enters promotion flow
- if Aristocat or another global promotion blocker is active, the immediate promotion is blocked too
