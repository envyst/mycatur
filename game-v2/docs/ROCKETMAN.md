# Rocketman

## Corrected rule
Rocketman (king):
- once per game
- first tap selects, second tap activates the special action
- teleports to a truly random empty square
- does not obey king-safety filtering during teleport
- spends the turn

## Current implementation
- one-time use tracked by piece id
- random target chosen from all empty squares on the board
- no safety rerolling
