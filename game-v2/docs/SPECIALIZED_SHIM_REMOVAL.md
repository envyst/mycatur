# Specialized Shim Removal

## Change
The temporary compatibility shims:
- `src/specialized-effects.js`
- `src/specialized.js`

have been removed.

## Reason
Active imports now point directly to the new specialized subsystem module tree, so the old top-level shim files were no longer needed.

## Result
The specialized refactor is now cleaner and less confusing, with one clear module structure under:
- `src/specialized/`
