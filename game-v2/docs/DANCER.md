# Dancer

## Corrected rule
If this bishop checks the enemy king, then on its next turn that same Dancer may take 2 moves in 1 turn. It cannot capture during those 2 moves. If another piece is moved instead, the special Dancer opportunity is lost.

## Current implementation
- Dancer behaves like a normal bishop for ordinary movement/check/checkmate
- if Dancer checks the enemy king, it becomes armed for its next same-color turn
- first tap shows normal bishop moves
- second tap enters special mode
- special mode shows final destinations reachable in up to 2 non-capturing bishop moves
- selecting another piece cancels the special mode and loses the special opportunity when another piece is moved instead
- active special-mode Dancer is tinted purple
