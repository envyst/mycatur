# Mycatur Board Layout Fix

## Issue
After adding the board-area banner, the board layout could become visually broken or constrained because the banner and board sizing were competing directly inside the center panel.

## Fix applied
- introduced a dedicated `.board-stage` wrapper
- made the board use `width: 100%` inside that wrapper
- kept the banner width tied to the same wrapper instead of independently to viewport math
- preserved mobile sizing by applying width rules to `.board-stage`

## Result
The board banner can remain visible without breaking the board dimensions/layout.
