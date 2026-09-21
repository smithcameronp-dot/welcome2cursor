# Game plan

Working plan. Proposals below are a starting position, not locked decisions.

## Fit for this repo

This repo is a set of self-contained demo projects. The game should match that:

- One folder, no shared app dependencies.
- Runs in the browser. No accounts, no database, no server.
- A first playable slice that a person can finish in a few minutes.
- Safe to delete and recreate between demos.

## Recommended first slice

A single-screen arcade game: one verb, one fail state, one score.

That shape is small enough to build and play in one pass, and it still leaves room for a second slice (levels, enemies, or a twist) after the core feels good.

Trade-off: a story game, RPG, or anything with menus and persistence will not fit this first slice. If that is the game we actually want, we should say so before building and drop the arcade constraint.

## Decisions still open

Fill these in before implementation.

| Decision | Proposal | Locked |
| --- | --- | --- |
| Working title | Untitled | No |
| Player fantasy | One clear action, repeated under pressure | No |
| Genre | Single-screen arcade | No |
| Win condition | Survive or reach a score | No |
| Lose condition | One hit, or a timer | No |
| Controls | Keyboard, mouse optional | No |
| Session length | 1–3 minutes | No |
| Art | Simple shapes, no asset pack | No |
| Audio | Optional, off by default | No |

## Build order, once the table is locked

1. Playable loop: start, act, fail, restart. No menus.
2. Scoring and a visible goal.
3. One piece of juice (screen shake, flash, or a rising difficulty).
4. Only then: extra mechanics.

## Out of scope until the loop is fun

- Accounts, saves, leaderboards
- Level editors
- Multiple characters or a story mode
- A build pipeline heavier than a static page
