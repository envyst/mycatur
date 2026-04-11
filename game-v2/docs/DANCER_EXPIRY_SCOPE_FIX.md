# Dancer Expiry Scope Fix

## Problem
Dancer special eligibility could expire too broadly, including from the wrong side's move or from interaction flow that was not an actual other-piece move commit.

## Fix
Scope expiry to:
- same-side move commits only
- another allied piece only

## Non-expiring cases
- enemy move
- tapping Dancer
- entering/cancelling special mode
