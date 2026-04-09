# Specialized Regression Checklist

Use this as a quick manual smoke checklist after changes touching specialized mode, board logic, promotion flow, or sandbox/shared state.

## General
- specialized ruleset can be enabled and game starts normally
- assigned specialized marker appears on the correct piece
- marker follows the piece after movement
- old square does not keep the marker
- normal chess still starts and plays normally
- sandbox mode still renders and works independently

## Iron Pawn
- moves forward normally
- can opening two-step if unobstructed
- cannot capture
- cannot be captured
- cannot en passant
- cannot be en-passant-ed
- cannot promote

## Basilisk
- moves like bishop
- cannot capture
- pieces it attacks cannot move
- kings are affected too
- if Basilisk pressure plus another attack removes all legal replies, checkmate logic still works
- opposing Basilisks can paralyze each other when applicable

## Anti Violence
- moves like knight
- cannot capture
- does not give check via normal knight capture semantics
- adjacent enemy pieces cannot capture
- adjacent enemy pieces can still make non-capturing moves

## Aristocat
- while any Aristocat is alive, all promotion is blocked
- blocked promotion means no promotion UI appears
- when no Aristocat exists, normal promotion works again
- promotion selection completes correctly and game continues

## Promotion baseline
- standard pawn promotion still works outside Aristocat blocking
- promotion UI closes after choice
- promoted piece appears correctly
- game does not get stuck after promotion
