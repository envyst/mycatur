# Mycatur PGN / History Progress

## Added in this pass
The frontend move history was upgraded from raw descriptive strings toward a more PGN-like move stream.

### Current direction
- store SAN-like move tokens per move
- render numbered history in chess-style sequence
- build a compact PGN-ish text blob for persistence into `game_sessions.pgn_text`

## Current limitations
This is still not a full tournament-grade SAN/PGN implementation yet.
Not yet covered thoroughly:
- full SAN disambiguation
- check/checkmate suffix markers in notation
- annotations/comments/variations
- export headers (Event, Site, Date, etc.)

## Why this is still useful now
It makes historical sessions and move storage much cleaner and closer to real chess notation while keeping the current custom rules engine architecture intact.
