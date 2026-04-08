# Iron Pawn Completion Fix

## Fixes applied in this pass
- Iron Pawn can no longer be captured via en passant if its rules say it cannot be captured
- Iron Pawn promotion suppression now reads the moving piece's specialization directly
- visible specialization marker now follows the actual piece object by reading `piece.specialization`

## Why
This completes the intended piece-bound specialization model for Iron Pawn instead of relying on leftover square-bound UI behavior.
