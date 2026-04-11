# Bouncer Bounce Direction Fix

## Problem
The initial bounce implementation used a too-generic reflection model that could produce non-bishop-like continuation paths.

## Corrected behavior
- Bouncer now preserves bishop-style diagonal continuity after a bounce
- it can bounce off vertical or horizontal walls
- only the axis that hits the wall flips
- maximum one bounce per move remains enforced
