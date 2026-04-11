# Marauder Check Fix

## Problem
Marauder's expanded range worked in legal move generation, but attack/check evaluation was not receiving the capture-count state needed to reproduce that expanded range.

## Fix
Pass `specializedCaptureCountsById` into the attack-evaluation pseudo-move path so Marauder range growth also counts for check detection.
