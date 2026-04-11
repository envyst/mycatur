# Dancer Cancel and Expiry Fix

## Fixes
- original square is no longer treated as a legal special destination for Dancer
- tapping Dancer again while already in special mode cancels the mode instead of acting like a move
- tapping elsewhere cancels Dancer special mode
- moving another piece clears Dancer's armed special opportunity as intended

## Goal
Make Dancer special mode behave like an explicit optional mode, not a self-overlap move path.
