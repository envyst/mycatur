# Electroknight

## Corrected rule
Electroknight (knight):
- after the same Electroknight moves 3 own-side turns consecutively, it becomes charged
- charged state persists across enemy turns
- if another allied piece moves, the charge resets
- if charged Electroknight moves without capturing, it stays charged
- if charged Electroknight captures, it also randomly destroys one adjacent enemy around its landing square
- discharge resets the charge

## Current implementation
- charge tracked by Electroknight piece id
- visual charged styling should use existing specialized status rendering hooks if present
- extra electrocuted piece is chosen truly randomly from adjacent enemy candidates only
