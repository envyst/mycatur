# Mycatur Frontend Persistence Wiring

## Added in this pass
The frontend now begins talking to the backend for:
- login/logout
- current user session
- list saved sessions
- create session
- load a saved session
- read-only finished session view
- persist game state updates and move history after moves

## Current UX direction
### Left panel
- login form / current user
- session creation controls
- saved session list

### Center
- board

### Right panel
- current game controls
- status
- move log

## Important current note
This is the first persistence wiring pass.
The backend foundation exists, but more polishing will still be needed for:
- better PGN notation quality
- stronger finished-session replay UX
- ownership/participant rules for human-vs-human sessions
- future Stockfish integration
