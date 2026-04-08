# Specialized Assignment Runtime Hardening

## Issue targeted
Starting a specialized game with an assigned piece could fail if assignment data contained null/blank/incomplete rows or if runtime helpers assumed fully compact valid data.

## Hardening applied
- empty assignment model standardized to 6 explicit nullable slots per side
- assignment counters now ignore null entries safely
- square parsing now validates input defensively
- board map builder now ignores invalid/incomplete assignment rows
- session load/start paths normalize specialized assignments before runtime use

## Intent
Prevent specialized setup state shape issues from crashing game start before actual piece logic is evaluated.
