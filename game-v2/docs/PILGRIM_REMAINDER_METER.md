# Pilgrim Remainder Meter Update

## Change
Pilgrim travel count is now treated as a reusable threshold meter rather than lifetime total.

## Behavior
- add move distance to current meter
- each successful 20-point trigger subtracts 20
- keep the remainder visible on the piece

## Examples
- 20 -> 0
- 25 -> 5
- 41 -> 1 after two triggers would only happen if supported by a single move path; current bishop movement usually crosses at most one threshold per move
