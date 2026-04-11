# Mini Checkpoint: Dancer (Stable)

## Confirmed working state
Dancer is now in a stable working state with the following confirmed behavior:

- Dancer behaves as a normal bishop for ordinary movement and check/checkmate relevance
- if Dancer checks the enemy king, it becomes eligible for the special movement mode on its next same-color turn
- first tap shows normal bishop moves
- second tap enters special mode
- original Dancer square is not a legal special destination
- tapping the same Dancer again while already in special mode cancels it
- clicking another allied piece cancels the visible special mode
- special mode shows final destinations reachable in up to 2 non-capturing bishop moves
- moving another allied piece expires the earned special opportunity
- moving the same Dancer normally also expires the earned special opportunity
- using the special move consumes the opportunity properly

## Purpose
This is the Dancer-specific rollback reference point after the heavier debugging/tap-flow work.
