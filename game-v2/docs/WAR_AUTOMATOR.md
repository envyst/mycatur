# War Automator

## Rule
War Automator (pawn) = Automatically moves forward 1 tile whenever any piece is captured.

## Current implementation
- behaves like a normal pawn for ordinary movement/capture behavior
- after any capture by either side, every living War Automator attempts to move forward 1 tile
- it only auto-moves if the forward square is inside board and empty
