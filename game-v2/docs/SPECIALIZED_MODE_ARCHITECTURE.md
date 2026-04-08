# Specialized Mode Architecture

## Status
Normal chess mode is treated as the stable baseline/reference.
Specialized mode is a separate mode layered on top of that baseline.

## Guiding rule
Do not contaminate normal chess mode with specialized-piece rules.

## Mode split
- `human-vs-human`
- `human-vs-ai`
- `specialized`

## Specialized mode phase 1
Phase 1 only implements assignment/setup and persistence.
No specialized effects are active yet.

## Assignment model
- each side may assign up to 6 specialized pieces
- assignment happens before the game starts
- assignment is attached to a specific starting square
- specialization must match the default/base piece type on that square

## Why starting square mapping
Using the starting square as identity is:
- unambiguous
- easy to persist
- easy to replay
- easy to validate before game start
