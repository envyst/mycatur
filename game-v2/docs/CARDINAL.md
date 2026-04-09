# Cardinal

## Source rule
Cardinal (bishop) = This bishop can move one tile directly backward without capturing.

## Current implementation
- base movement: bishop
- plus one square directly backward relative to piece color
- backward move is non-capturing only

## Direction
- white bishop backward = row + 1
- black bishop backward = row - 1
