# Bullpen Blast

Pitch a full 9 innings. Chase a perfect game.

Phase 1 is **headless game logic** only. `src/game/` has no renderer. The older canvas page in this folder is the previous preview, not the spec pipeline.

```bash
npm test
npm run dev
```

## Layout

- `ARCHITECTURE.md` — coordinates and trajectory math
- `src/config.ts` — every tuning number
- `src/game/` — physics, mouse gesture, batter AI, 9-inning rules
- `src/data/teams.ts` — Gulls vs fictional clubs
- `src/render/` — phase 2
- `src/ui/` — phase 5

## Mixamo clip names

Retarget onto `/assets/models/pitcher.glb`, `batter.glb`, `catcher.glb`, `umpire.glb`.

Pitcher: `idle_set`, `windup_delivery`, `follow_through`, `walk_off_mound`, `fist_pump`, `hat_tip`, `step_up_stairs`, `confident_walk`, `toss_ball_idle`, `step_on_rubber`

Catcher: `crouch_idle`, `receive`, `throw_back`

Batter: `stance_L`, `stance_R`, `swing`, `check_swing`, `take`, `flinch_inside`, `look_back_at_ump`, `walk_to_box`

Umpire: `idle`, `call_ball`, `call_strike`, `ring_up_k`

Crossfade 300 ms. Root motion on cutscene walks.
