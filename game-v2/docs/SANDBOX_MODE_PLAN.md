# Sandbox Mode Plan

## Confirmed behavior
- separate `sandbox` ruleset toggle
- free board editing with no turn enforcement
- pieces can be moved anywhere
- destination overwrite removes existing occupant
- summon piece to board
- delete piece from board
- undo supported
- AI move is on-demand only in human-vs-ai
- castling rights should stay preserved unless actually used

## This checkpoint
Initial sandbox mode scaffolding added:
- sandbox ruleset registered
- sandbox state/history added
- basic sandbox action functions added for move/delete/summon/undo

## Next implementation work
- full UI controls
- board interaction routing for sandbox
- AI request button integration
- minimal-valid-board checks for AI requests
