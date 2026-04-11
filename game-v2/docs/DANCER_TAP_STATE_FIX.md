# Dancer Tap-State Fix

## Issue
The second tap could fail to enter Dancer special mode because the armed/cancel logic around same-square interaction was too eager and collapsed the state machine.

## Fix
Add explicit tap-armed state so Dancer interaction becomes:
- first tap -> normal selection
- second tap -> enter special mode
- third tap while in special mode -> cancel
