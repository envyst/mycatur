# Icicle

## Source rule
Icicle (bishop) = Enemies adjacent for 2 turns become Frozen, costing a turn to unfreeze. Cannot capture.

## Current implementation
- base movement: bishop
- cannot capture
- enemy pieces adjacent continuously for 2 turns become Frozen
- adjacency break resets progress unless already frozen
- Frozen pieces have no legal moves
- selecting a Frozen piece on its side's turn spends that turn to unfreeze it
- kings are included
