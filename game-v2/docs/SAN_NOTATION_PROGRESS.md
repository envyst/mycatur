# Mycatur SAN Notation Progress

## Added in this pass
The move history notation was improved toward stronger SAN-like correctness.

### Implemented
- check suffix support: `+`
- checkmate suffix support: `#`
- castling notation: `O-O`, `O-O-O`
- basic same-piece destination disambiguation for non-pawn, non-king pieces
- promotion suffix direction like `=Q`
- capture-aware notation direction

## Important note
This is stronger than the previous pass, but still not guaranteed to be perfect SAN in every edge case.
Remaining risk areas later:
- deeper disambiguation corner cases
- exact SAN parity expectations in rare positions
- annotation/comment/export features
