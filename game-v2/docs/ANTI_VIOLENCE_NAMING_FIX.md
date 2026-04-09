# Anti Violence Naming Fix

## Issue
The assignable specialized catalog used `Anti Violence` while the effect engine lookup was registered as `Anti violence`.

## Result
Assignments could succeed in UI, but runtime effect lookup missed, so the piece behaved like a normal knight.

## Fix
Aligned the runtime effect definition with the actual catalog name: `Anti Violence`.
