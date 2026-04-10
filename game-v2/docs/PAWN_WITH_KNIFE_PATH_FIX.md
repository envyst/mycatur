# Pawn with Knife Path Fix

## Correction
The extra inward capture is not a leap.

## Correct behavior
- Pawn with Knife may capture two squares diagonally forward toward the center
- the intermediate diagonal square must be empty
- if any piece blocks that intermediate square, the extended capture is not allowed
- no extra extended capture exists on the outward side
