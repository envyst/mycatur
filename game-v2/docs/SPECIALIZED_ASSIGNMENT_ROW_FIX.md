# Specialized Assignment Row Fix

## Issue
The earlier assignment-only specialized setup did not behave correctly:
- row state was unstable after redraw
- chosen specialization did not reliably repopulate the assigned-piece dropdown
- layout was not clearly side-by-side

## Fix applied
- preserved 6 explicit assignment slots per side
- specialization selection now persists per row
- assigned-piece dropdown repopulates immediately from the chosen specialization's matching piece family
- row layout uses a clearer side-by-side structure with an arrow divider
