# Sandbox Bugfix: UI Guard and AI Castling

## Fixes
- guarded sandbox control rendering so missing DOM nodes do not crash with `onclick` null errors
- sandbox AI moves now use `applyMove(...)` so castling performs the rook move correctly
- sandbox status path hardened to avoid normal final-result behavior leaking into sandbox after custom edits / AI requests
