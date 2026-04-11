# Unfreeze Cleanup Fix

## Issue
After a successful unfreeze action, the self-selection/highlight could remain active, leaving the piece in a misleading state.

## Fix
Clear selection/highlights immediately after the unfreeze action succeeds and the turn is consumed.
