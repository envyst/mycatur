# Promotion Pending Context Fix

## Issue
The promotion UI could appear, but the move-context payload required to complete promotion (`pendingPromotionMove`) was not being stored in the current `makeMove()` path.

## Result
Promotion selection had incomplete context and the game could remain stuck.

## Fix
Restore the pending promotion move payload so promotion completion has the move context it needs.
