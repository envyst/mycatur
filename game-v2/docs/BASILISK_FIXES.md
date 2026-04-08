# Basilisk Fixes

## Problems fixed
- Basilisk could still capture because directional slider capture logic still had an old square-bound branch
- Basilisk attacks were not participating correctly in king/check logic because attack detection called pseudo-legal moves with a non-specialized context

## Result
- Basilisk movement now stops at the first occupied square as usual for bishop movement
- Basilisk cannot capture that blocking enemy piece
- Basilisk attack/paralysis now participates in specialized attack evaluation more correctly, including king interactions
