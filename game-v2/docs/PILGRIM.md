# Pilgrim

## Corrected rule
Pilgrim (bishop):
- tracks total travel distance over time
- every time its cumulative travel crosses another 20-square threshold, it resurrects an allied bishop
- the resurrected bishop appears on the Pilgrim's departure square from the threshold-crossing move
- this does not require any dead allied bishop; it can create an additional bishop even if all bishops are still alive
- repeatable at 20, 40, 60, ... total traveled squares

## Current implementation
- travel tracked by Pilgrim piece id
- move distance counted as bishop travel distance for that move
- if a move crosses one or more 20-square thresholds, that many bishops are spawned on the departure square
