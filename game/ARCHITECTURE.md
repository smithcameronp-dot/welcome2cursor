# Phase 1 plan — structure and pitch math

Stop after this phase for review. Render, glTF, post, UI, and cinematics are later.

## File structure

```
game/
  src/config.ts          all tuning
  src/game/              rules, physics, AI — no three, no DOM
    types.ts
    rng.ts
    pitches.ts
    gesture.ts
    physics.ts
    batter.ts
    rules.ts
    outing.ts
    index.ts
  src/data/teams.ts      fictional clubs
  src/render/            empty until phase 2
  src/ui/                empty until phase 5
  test/*.test.ts
```

`src/park.js` / `look.js` / the current page stay as the old preview. They are not the spec pipeline.

## Coordinates

Meters. Home plate origin. +Z to the mound (60.5 ft = 18.4404 m). +Y up. +X toward first. Pitcher throws toward −Z.

## Trajectory

Fixed step `dt = 1/120`. Release at the rubber, aim at the cursor on the plate plane `z = 0`.

```
v = normalize(aim + scatter − release) * speed(pitch, power)
each step:
  a = (0, G, 0) + breakAccel(pitch) + dragBreak(gesture) + knuckleFlutter
  v += a dt
  p += v dt
until z <= 0
```

Flight time is a feel scale, 0.50–0.90 s, not live-radar mph. Power is how many of the five circles filled. Overhold and excess cursor travel add scatter, not speed.

Break is extra acceleration, not a post-hoc offset:

| Type        | Extra a at the plate |
|-------------|----------------------|
| Fastball    | less drop than gravity |
| Sinker      | down                 |
| Slider      | glove-side + some down |
| Curveball   | more down + some glove-side |
| Changeup    | down, slower v0      |
| Knuckleball | smoothed random jerk |

The batter sees the plate crossing `(x, y)` and the speed. A changeup after a fastball is slower than expected. A slow pitch in the heart of the zone is a hanger — they swing and punish it; it is not a free strike.
