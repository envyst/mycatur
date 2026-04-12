# Fission Reactor

## Rule
Fission Reactor (queen) = Explodes on its 5th capture, destroying itself and all diagonally adjacent enemies.

## Current implementation
- behaves like a normal queen otherwise
- tracks capture count by piece id
- on its 5th capture:
  - the Fission Reactor destroys itself
  - all diagonally adjacent enemy pieces are also destroyed
- non-enemy diagonal neighbors are not destroyed
