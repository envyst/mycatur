# Mycatur Stockfish Black-Side Start Fix

## Issue
When the player chose black in human-vs-ai mode, the AI (white) did not automatically make the opening move after loading/creating the session.

## Fix applied
After loading a session into the frontend game state, the app now immediately checks whether the engine should move first and triggers that path when appropriate.
