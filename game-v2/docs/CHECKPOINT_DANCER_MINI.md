# Mini Checkpoint: Dancer

## Confirmed working state
Current Dancer behavior is in a good mini-checkpoint state:

- Dancer behaves as a normal bishop for ordinary movement and check/checkmate relevance
- if Dancer checks the enemy king, it becomes eligible for the special movement mode on its next same-color turn
- first tap shows normal bishop moves
- second tap enters special mode
- original Dancer square is not a legal special destination
- third tap/click on the Dancer cancels special mode
- clicking another allied piece also cancels special mode
- special mode shows final destinations reachable in up to 2 non-capturing bishop moves

## Remaining follow-up
- ensure moving another allied piece expires Dancer's earned special opportunity completely
