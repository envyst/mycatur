# Gunslinger Multi-Target Fix

## Correction
Gunslinger may have multiple simultaneous eligible targets if several enemy pieces mutually threaten it for a full turn.

## Updated behavior
- per-Gunslinger target tracking supports multiple armed targets
- the destroy action removes all currently armed targets in one turn-consuming action
- eligible armed targets are visually tinted:
  - white target -> pink
  - black target -> dark red
