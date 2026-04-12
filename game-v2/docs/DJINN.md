# Djinn

## Corrected rule
Djinn (bishop):
- can spend a turn to dissipate with no special prerequisite
- first tap selects it, second tap on the same Djinn dissipates it
- Djinn disappears from the board
- the first capture by either side brings it back to its saved tile
- if another piece occupies that tile when Djinn returns, that piece is removed and Djinn takes the square

## Current implementation
- dissipated Djinn state is tracked by piece id
- return trigger is the first capture after dissipation
- return happens before move finalization completes
