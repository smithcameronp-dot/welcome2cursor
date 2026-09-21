# Welcome to Cursor

A home for **Cursor demo assets** — sample projects, runbooks, rules, and supporting material used when demoing Cursor to customers.

This repo is meant to be cloned, reset, and reused across live demos. Everything here is designed to show Cursor working on realistic code, not toy examples.

---

## What's in here

| Asset type | Purpose |
|------------|---------|
| **Demo apps** | Small, realistic codebases with planted seams for live agent work |
| **Runbooks** | Step-by-step demo scripts with prompts, timing, and recovery steps |
| **Cursor config** | Rules, skills, and MCP setup notes for consistent demo environments |
| **Reset baselines** | Git tags and scripts to return to a known-good state between sessions |

More assets will be added over time. Each demo project lives in its own folder with its own README and runbook.

---

## Quick start

### 1. Clone this repo

```bash
git clone https://github.com/smithcameronp-dot/welcome2cursor.git
cd welcome2cursor
```

### 2. Pick a demo project

Open the project folder you want to run (see [Demo projects](#demo-projects) below) and follow its README.

### 3. Reset before every demo

Always start from a clean baseline so planted bugs, half-built features, and narrative seams are intact.

```bash
# Inside a demo project — see project README for exact commands
pnpm reset
```

For a full code + data reset, check out the project's tagged baseline (e.g. `demo-start`) and run its reset script.

---

## Demo projects

| Project | Description | Stack |
|---------|-------------|-------|
| **Beacon** *(coming soon)* | Linear-style issue tracker with board, list, and detail views | Next.js, Prisma, SQLite |
| **Game** *(planning)* | Browser game. See `game/PLAN.md` before any code. | Not chosen yet |

Each project includes:

- A **quick start** for local setup
- A **DEMO.md runbook** with scenes, prompts, and timing
- **Planted seams** — intentional bugs, TODOs, and refactor targets for the agent to work through live

---

## Demo flow (typical)

A standard customer demo runs through Cursor capabilities on real code:

1. **Onboarding** — Ask/Plan mode, `@` file references, codebase understanding
2. **Inline edit** — Tab completion and scoped changes in existing files
3. **Agent feature work** — Multi-file edits to wire up half-built UI
4. **Refactor** — Extract components and update imports across the codebase
5. **Debug** — Fix a failing test with agent help
6. **Tests + CI** — Generate tests, commit, and show GitHub Actions
7. **MCP** *(optional)* — Integrate with external tools (Linear, Slack, etc.)

See each project's `DEMO.md` for exact prompts and durations.

---

## Repo structure

```
welcome2cursor/
├── README.md          ← you are here
├── beacon/            ← issue tracker demo (planned)
├── game/              ← browser game (planning)
├── rules/             ← shared Cursor rules for demos (planned)
└── skills/            ← demo-specific agent skills (planned)
```

Structure will evolve as more assets are added. Prefer self-contained folders over shared dependencies so each demo can be reset independently.

---

## Tips for live demos

1. **Reset before you go on stage** — never demo from a repo you've already modified in rehearsal without resetting.
2. **Use the runbook** — `DEMO.md` in each project has exact prompts; ad-libbing leads to dead ends.
3. **Don't fix the seams beforehand** — the value is watching Cursor work through real, imperfect code.
4. **Tag your baseline** after first successful setup: `git tag demo-start`.
5. **Keep a panic reset handy** — know the one-liner to restore DB + code mid-demo.

---

## Contributing

This is a personal demo asset repo. If you're adapting it for your own customer demos:

- Fork or copy individual project folders
- Replace customer-specific MCP credentials and rules with your own
- Add new demo projects as sibling folders with their own README and runbook

---

## License

Demo assets are provided for internal and customer demo use. Check individual project folders for any additional license notes.
