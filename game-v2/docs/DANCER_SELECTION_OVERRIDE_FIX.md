# Dancer Selection Override Fix

## Problem
After arming the second tap for Dancer, the generic same-color selection path could still overwrite that state through a normal `setSelection(...)` call.

## Fix
Preserve the Dancer second-tap armed state instead of letting the generic reselection path stomp on it.
