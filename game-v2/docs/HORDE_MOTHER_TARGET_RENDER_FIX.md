# Horde Mother Target Render Fix

## Root cause
Board target rendering previously required a selected square, which suppressed valid target highlights during Horde Mother's pending hordeling-placement step.

## Fix
Allow target highlights to render when `pendingHordeSpawn` is active, even without a selected piece.
