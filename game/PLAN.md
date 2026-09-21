# Bullpen Save

Locked rules for the playable build in this folder.

Bullpen Save uses the Bullpen Blast pitching loop: pick a pitch, pick a spot, stop a speed dial. The card layout (pitcher on the left, batter ratings and tendencies on the right, view from behind the mound) follows the broadcast screenshot we used as reference. Names, uniforms, and parks are original. No Nabisco, MLB, Topps, or The Show marks.

## Outing

You pitch until you record 27 outs or the manager pulls you. Outs are strikeouts, groundouts, and flyouts. A perfect game is 27 outs with zero hits, zero walks, and zero hit-by-pitches.

Hits do not end the outing by themselves. Fair contact is either an out or a hit. There is no fielding minigame and no baserunning minigame. Each inning remembers how many runners are on, from 0 to 3.

- A single, or a walk, adds a runner and scores one if the bases were already full.
- A hard hit scores everyone who was on and leaves a runner.
- A home run scores everyone, including the batter, and clears the bases.
- Three outs clear the bases.

The manager comes out after a play with **11 hits** or **7 runs**. He walks from the dugout, along the foul line, to the mound, and takes the ball. The outing ends. Ten hits and six runs do not bring him out.

## Result odds

These are the chances for one outing at average execution: the release window is hit about half the time, locations are mixed, and pitch type is not matched to the batter. The written ranges shared the 5-hit and 10-hit edges. Five stays in the 1–5 band. Ten stays in the 6–10 band.

- Perfect game: 2%
- 1–5 hits: 20%
- 6–10 hits: 33%
- 11 or more hits, which ends on the hook: 45%

A hidden mix of rough, ordinary, and sharp days produces that spread. The dial and the pitch you call move a given day. Top-of-the-order hitters are more dangerous than the 8 and 9 holes on the same pitch.

## Pitch

1. Type: fastball, sinker, slider, curve, changeup. Each has its own release window.
2. Location: tap the zone over the plate, including the chase ring.
3. Dial: stop the needle inside the window. Early misses dive. Late misses hang. Letting the needle finish is the worst miss.

## Clubs

Real cities, fictional names. The pitcher is Cole Brant of the San Antonio Gulls.

- Austin Otters
- Portland Locks
- Nashville Echoes
- Buffalo Steel

Lineups are nine fictional batters: table-setters at 1–2, the best hitters at 3–5, ordinary at 6–7, weaker at 8–9.

## Entrance

Before the first pitch, Brant comes out of the dugout under overhead cameras that orbit the park. Pump-up music plays for that run. He sprints the chalk, jumps off the basepath, and walks to the mound as the camera settles behind him.

## Out of scope

Accounts, saves, a season, baserunning controls, and a native SwiftUI port. This build is a landscape touch page so it can be played in a browser.
