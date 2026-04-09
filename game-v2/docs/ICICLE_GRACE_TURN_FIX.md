# Icicle Grace-Turn Fix

## Intended behavior
Adjacent enemy pieces should have one full turn opportunity to leave the Icicle adjacency zone or capture the Icicle before freezing applies.

## Fix
Icicle freeze timing now uses a pending-freeze state first. A piece only becomes Frozen if adjacency persists across the opposing turn opportunity instead of freezing immediately.
