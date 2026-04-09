# Anti Violence Capture and Check Fix

## Fixes
- Anti Violence knight can no longer capture
- Anti Violence can no longer give check through a capture-capable knight attack model

## Why
If the piece cannot capture, its attack/capture behavior must not still be treated like a normal knight during move generation or king-attack evaluation.
