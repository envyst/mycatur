# Gunslinger Turn Consume Fix

## Issue
After the Gunslinger double-tap destroy action succeeded, stale move selection/highlights could remain active, allowing follow-up movement on the same turn.

## Fix
Clear selection/highlights immediately after Gunslinger destroys the enemy piece and hands the turn over.
