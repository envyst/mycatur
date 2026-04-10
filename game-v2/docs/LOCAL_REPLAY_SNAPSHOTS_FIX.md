# Local Replay Snapshots Fix

## Problem
Replay behavior was too dependent on loaded session history, so local/no-login games did not maintain a usable replay board timeline.

## Fix
- initialize replay snapshots at local game start
- append replay board snapshots after local moves
- append replay snapshot after promotion completion too

## Goal
Make move-log clicks and replay controls work for local/no-login games as well as persisted sessions.
