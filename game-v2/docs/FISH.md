# Fish

## Source rule
Fish (knight) = If this moved last turn, it can also move 1 tile in any direction without capturing.

## Current implementation
- base movement: knight
- if the same Fish piece was the last moved piece, it also gains one-square king-like non-capturing moves
- bonus one-step moves only go to empty squares
