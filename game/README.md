# Bullpen Save

Landscape pitching game. Throw a perfect game, or stay in long enough that the manager leaves you on the mound.

You pick the pitch, the location, and when the speed dial stops. Twenty-seven outs with no hits and no walks is a perfect game. Eleven hits or seven runs and the manager walks out and takes the ball.

## Play

From this folder:

```bash
python3 -m http.server 8765
```

Open `http://127.0.0.1:8765` in a landscape window. Choose a club, watch the entrance, then pitch.

`?preview=intro` replays the dugout run. `?preview=hook` replays the manager's walk.

## Test

```bash
npm test
```

The suite checks the count, the hook thresholds, and that average pitching lands near the published hit odds (perfect 2%, 1–5 hits 20%, 6–10 hits 33%, 11 or more 45%).

## Layout

- `PLAN.md` — locked rules
- `data/teams.js` — Gulls pitcher and the four lineups
- `src/resolve.js` — pitch outcomes, runs, and the hook
- `src/draw.js`, `src/intro.js`, `src/audio.js` — entrance, manager walk, music
- `index.html` — the mound screen
