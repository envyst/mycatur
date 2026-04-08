# Mycatur Replay and Notation Progress

## Added in this pass
- stronger SAN-like move formatting direction
- session move history displayed in cleaner numbered chess-style notation
- replay controls added in UI:
  - jump to start
  - previous move
  - next move
  - jump to end/live board
- finished sessions can now be used as a more meaningful history/replay surface

## Important current note
Replay support currently uses stored per-move board snapshots from the backend move history table.
This is practical and simple for now.

## Still to improve later
- stronger SAN correctness and suffixes (`+`, `#`)
- smoother replay state labeling
- richer historical metadata
- optional export/download format later
