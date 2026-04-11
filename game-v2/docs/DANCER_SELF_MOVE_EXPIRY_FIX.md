# Dancer Self-Move Expiry Fix

## Problem
If Dancer had an earned special opportunity and then made a normal move without using the special mode, the eligibility could incorrectly persist.

## Fix
A normal Dancer move now consumes/clears the earned special opportunity unless the player is actively using the special movement mode.
