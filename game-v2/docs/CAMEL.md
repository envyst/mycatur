# Camel

## Source rule
Camel (knight) = This knight leaps 3 tiles in one direction and 1 tile to the side.

## Current implementation
- base family: knight
- move pattern replaced with camel leaps:
  - (±3, ±1)
  - (±1, ±3)
- leaps like a knight, so blocking pieces do not matter
- captures normally unless another specialized rule suppresses capture
