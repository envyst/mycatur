# Phase Rook

## Source rule
Phase Rook (rook) = Can pass through allies, but can't capture through them.

## Current implementation
- base movement: rook
- allied pieces do not block movement path
- Phase Rook cannot overlap allies; it only passes through them
- enemy pieces behind one or more allied pieces cannot be captured through those allies
- normal rook captures still work when no allied piece is being passed through
