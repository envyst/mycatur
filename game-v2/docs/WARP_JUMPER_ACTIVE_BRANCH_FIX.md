# Warp Jumper Active Branch Fix

## Root cause
The previous Warp Jumper attempts did not land in the active pawn move-generation branch used by `getPseudoLegalMoves`.

## Fix
Add the enemy-pawn-chain jump rule directly into the live pawn move generator.
