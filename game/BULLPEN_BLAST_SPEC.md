# BULLPEN BLAST — Cursor Build Spec

Recreation of the late-90s Skyworks/Candystand pitching game "Bullpen Blast," rebuilt with modern, polished 3D visuals in the style of a AAA baseball sim. Core loop: pitch a full 9-inning game and try to throw a perfect game (27 straight outs, no hits, no walks).

Work through this in the phases listed at the bottom. Stop for review after each phase.

---

## 1. TECH

- Three.js (latest stable), ES modules, Vite for dev/build. TypeScript preferred.
- Strict separation: `game/` (state, rules, pitch physics, batter AI) has zero rendering imports; `render/` (scene, camera, animation, post) reads from game state; `ui/` (HTML/CSS overlay) reads from game state.
- Fixed-timestep simulation (120 Hz) with interpolated rendering. Target 60 fps at 1080p.
- All tuning numbers (pitch speeds, break, meter timing, AI thresholds, camera positions, cutscene durations) live in one `config.ts`.
- Asset paths are conventions I will fill later:
  - `/assets/models/pitcher.glb`, `batter.glb`, `catcher.glb`, `umpire.glb`
  - `/assets/hdri/stadium.hdr`
  - `/assets/textures/` (grass, dirt, uniform, crowd atlas)
  - `/assets/audio/`
- Until real assets exist, use a placeholder rigged glTF humanoid (e.g., Three.js example "Xbot" or any CC0 rigged human) so the pipeline is proven. Never build procedural box/capsule humanoids.
- Teams are fictional (e.g., Gulls vs. Otters). No real MLB teams, players, logos, or stadium names.

---

## 2. GAMEPLAY

### Pitch selection
- Before each pitch, player picks from: Fastball, Changeup, Curveball, Slider, Sinker, Knuckleball.
- Each type has base velocity and a movement profile (horizontal/vertical break curve). Knuckleball has random flutter.

### The mouse gesture (core mechanic — must feel right)
- Player presses mouse down over the plate area to start the throw. Release point = cursor location.
- While held, a power meter of 5 circles fills sequentially (~1.2 s to fill all). More circles = more velocity. Holding past the 5th causes control loss.
- Cursor travel during the hold adds extra break in that direction (e.g., drag up on a knuckleball = floater). Excess drag reduces accuracy.
- Ball travels mound → plate in ~0.5–0.9 s depending on velocity, following the computed trajectory.

### Batter AI
- Each batter has hidden ratings: contact, power, discipline (walk tendency), hot/cold zone. Lineup of 9, mix of L/R.
- Swing/take decision based on final location vs. zone, speed vs. expected speed (changeup after fastball fools them), and discipline.
- Swing outcome: miss, foul, or ball in play → out (fly/ground/line) or hit (1B/2B/3B/HR), weighted by ratings and pitch location quality.
- Very slow / minimal-power pitches are NOT automatic strikes — batters crush hangers. Prevent the classic knuckleball-floater exploit.

### Rules / state
- Full balls/strikes/outs; foul on two strikes doesn't add a strike; 4 balls = walk; 3 strikes = K.
- Track innings 1–9, outs, batter number, H / BB / K, pitch count.
- Status indicator: PERFECT GAME → NO-HITTER (after a walk) → GAME (after a hit).
- End screen after 27 outs: Perfect Game / No-Hitter / Complete Game, final stats, Play Again.

---

## 3. CAMERA — BEHIND THE PITCHER, ALWAYS

- The only gameplay camera. ~10 ft directly behind the rubber, ~6.5 ft high, looking straight down the mound-to-plate line. Pitcher's back and cap fill the lower-center/left of frame, slightly soft; catcher's mitt and batter dead center at the plate, sharp. FOV ~30°.
- Never a batter's-eye view, never facing the pitcher from the plate, never a center-field broadcast angle during gameplay.
- Subtle handheld micro-drift (0.5–1 px over a pitch) and a small whip (2–3° tilt, 150 ms) synced to release.
- On a ball in play: one smooth push/tilt to follow the ball ~1.5 s, then ease back.

---

## 4. VISUAL TARGET — POLISHED, REALISTIC

### Characters
- Rigged glTF humanoids with skeletal animation via AnimationMixer. Required clips (list exact expected names in README so I can retarget Mixamo):
  - Pitcher: `idle_set`, `windup_delivery`, `follow_through`, `walk_off_mound`, `fist_pump`, `hat_tip`, `step_up_stairs`, `confident_walk`, `toss_ball_idle`, `step_on_rubber`
  - Catcher: `crouch_idle`, `receive`, `throw_back`
  - Batter: `stance_L`, `stance_R`, `swing`, `check_swing`, `take`, `flinch_inside`, `look_back_at_ump`, `walk_to_box`
  - Umpire: `idle`, `call_ball`, `call_strike`, `ring_up_k`
- 300 ms crossfades between clips. Root motion drives cutscene walks along splines.
- Uniforms: PBR cloth materials (roughness, wrinkle normal map), team colors and numbers via texture, subtle secondary motion on sleeves. Cap and belt as separate meshes.

### Stadium
- Real proportions: 60'6" mound-to-plate, 90' bases, correct mound height, foul lines, batter's boxes, on-deck circles, warning track, outfield wall ~330/400/330 ft with padding and yellow line, dugouts with steps, backstop netting, two-deck grandstand, light towers, outfield scoreboard screen.
- Grass: tiled hi-res texture + mow-stripe overlay. Dirt: separate PBR texture, darker/packed near the rubber. Chalk lines slightly scuffed. Rosin bag on the mound. Bases and plate as geometry.
- Crowd: instanced low-detail seated figures or billboard atlas, color variety, subtly animating, standing/clapping on big moments. Not a flat noise texture.
- Flags and banners with wind motion.

### Lighting / rendering
- PBR, sRGB output, ACES filmic tonemapping, real exposure. HDRI environment.
- Day: warm late-afternoon directional sun from the third-base side, soft cascaded shadows; pitcher casts a long shadow toward the plate; sun flare only when in frame. Faint heat shimmer at the horizon.
- Night: 4–6 tower spotlights with haze/god-rays and bloom.
- Post: depth of field (pitcher's back soft, plate sharp, stands soft; rack focus onto the ball at the plate), SSAO, bloom, 2–3% film grain. Vignette in cutscenes only.
- Instancing + LODs for crowd and stands.

### Ball & impact feel
- White ball with red stitching, seam rotation matching pitch type (4-seam backspin, curveball topspin, slider gyro tilt). Thin motion trail. Dust puff on mitt impact.
- Mitt pop: mitt recoils and closes, catcher absorbs it, short screen shake on hard fastballs.
- Batter reactions: check swing, flinch on inside pitches, look back at ump on called strikes.
- Umpire: no motion on ball, punch-out on called strike, big ring-up on strike three.

### Audio
- Mitt pop, bat crack (3 variants), crowd murmur bed that swells on strikeouts, PA reverb on ump calls, PA announcer for lineup. Master bus with mix levels in config.

---

## 5. UI — BROADCAST OVERLAY STYLE

- Everything anchored to edges; center of frame stays clear. All panels fade to 30% opacity while the ball is in flight.
- Bottom-left: pitch selection (compact pill/radial menu near the pitcher, fades out during the pitch).
- Bottom-right: score bug — teams, inning, count, outs, pitch count. Semi-transparent dark glass, clean sans-serif.
- Top-right: batter card — name, bats L/R, lineup slot, POW/CON/VIS/SPD bars.
- Top-left: pitch-tracker inset after each pitch (location in a K-zone box + MPH). Also a stacking K-board ("K K K K").
- Strike zone: thin translucent box rendered in 3D at the plate, visible only while aiming. Optional 3×3 subdivision while aiming. Never a floating 5×5 grid.
- Inning transitions: broadcast lower-third ("Top 5th · 0 H · 0 BB · 7 K") with smooth crossfade. Ease-in on all UI, no hard pops.
- Must scale to any window size and never clip.

---

## 6. CINEMATICS

Shared cinematic camera system: spline-driven camera + long lens + shallow DOF + vignette/grain. All cutscenes skippable with any click after 0.5–1 s. Settings toggle to disable each.

### 6a. Opening hero sequence (new game, ~10 s, 3 shots)

**Shot 1 — Dugout exit (3 s)**
Camera at the mouth of the home dugout, knee height, looking up the steps. Pitcher climbs toward camera and passes the lens; bright field beyond the dark dugout frame — silhouette moment, then lit as he steps out. Muffled dugout ambience → crowd swell. PA: "Now pitching for the [home team]… number 21…"

**Shot 2 — The walk (4.5 s)**
Front tracking shot, camera ~15 ft ahead at chest height, dollying backward toward the mound. Long lens, shallow DOF. Pitcher tosses ball into glove / adjusts cap. Mow stripes converge on the mound; warm sun from camera-left with rim light. Lower-third: name, team, "STARTING PITCHER," fictional stat line. Crowd on their feet behind him.

**Shot 3 — Toeing the rubber (2.5 s)**
Low wide shot from behind the mound. Pitcher steps up, sets his foot on the rubber; camera rises and eases into the EXACT gameplay camera position with no cut. Batter already walking into the box, catcher settling. UI fades in over the last 0.8 s. "Call a pitch" prompt. Game live.

- Root motion along a dugout→mound spline; the walk must end exactly on the rubber, facing the plate, as Shot 3 begins. Draw the spline as a debug line for review.
- Never replays on "Play Again" unless the setting is on.

### 6b. Strikeout cinematic (every strike three)

- Hold pitch camera ~400 ms (mitt pop, ring-up), then hard cut.
- Camera low at chest height between mound and third base, looking back at the pitcher. Pitcher walks from the rubber toward/past camera in three-quarter view, glove tucked, eyes down. Camera dollies back and pans, pitcher framed left-of-center.
- ~85 mm-equivalent lens (~18° FOV), very shallow DOF: pitcher tack sharp, stands/scoreboard soft bokeh. Slight anamorphic flare when sun clips frame. Hard warm key from camera-right, rim on shoulder and cap brim, bloom on white uniform.
- Background alive: crowd standing/clapping, scoreboard updating K count, flags moving.
- Duration: 2.5 s standard K; 4 s inning-ending K (`fist_pump`, pitcher exits frame); final out uses `hat_tip`.
- Lower-third at 0.6 s: pitcher name, "STRIKEOUT #7," putaway pitch type + MPH. K-board increments.
- Exit: 250 ms dip-to-black or crossfade back to gameplay camera, next batter stepping in.

### 6c. Lighter cutscenes
- Walk: 2 s, camera stays behind pitcher, he looks away.
- Hit: ball-follow camera (see §3).
- Inning change: 2 s wide establishing shot from behind home plate with inning lower-third.

---

## 7. BUILD PHASES (stop for review after each)

1. Game logic complete and unit-tested headless (pitch physics, gesture → trajectory, batter AI, rules, 9-inning flow).
2. Behind-the-pitcher camera + stadium geometry + lighting + tonemapping. Render a PNG for review.
3. glTF character pipeline with placeholder model: AnimationMixer, clip name contract, crossfades. Pitch/receive/swing/ump clips wired.
4. Ball rendering, seam rotation, impact feel, DOF/post stack, crowd instancing.
5. Broadcast UI overlay.
6. Cinematic camera system: opening hero sequence spline + framings (placeholder model), then strikeout cutscene, then lighter cutscenes.
7. Audio, transitions, settings, performance pass. Report frame budget.

Before starting, write a short plan of the file structure and the pitch trajectory math. When done, list all tuning constants and known rough edges.
