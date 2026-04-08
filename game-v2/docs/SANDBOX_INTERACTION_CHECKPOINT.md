# Sandbox Interaction Checkpoint

## Added in this pass
- free board movement in sandbox mode
- move any piece to any square
- occupied destination gets replaced
- summon selected piece onto selected square
- delete selected piece
- undo sandbox actions
- ask-AI button now makes an on-demand AI move in sandbox human-vs-ai
- minimal AI validation: both kings must exist

## Design notes
- sandbox bypasses normal turn-based legality for manual edits
- normal mode remains on the normal move path
- castling rights remain preserved unless used by normal move logic
