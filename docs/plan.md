# Tortoise — the general plan

> Slow and steady, to 99.

Tortoise is a phone app (a PWA) that keeps a 60-year exercise plan on track, one day at a time. It shows the day's session,
guides it with timers, records what was done, and tracks tests and milestones over the decades. It is about exercise
only.

## Goals (the owner's, 2026-11-21)

1. **At 99:** a straight back, and still able to jump and run.
2. **A handstand:** not possible yet; one day.
3. **The splits:** the side split and the front split.
4. **The app:** a plan for every day, a record of whether each day's exercise was done, and achievement milestones.

## The plan in three parts

### 1. [App design](1-app-design.md)

- A private, offline iPhone app at <https://tortoise.doctornova.net>. The data stays on the phone; there is no account
  and no server.
- Five tabs: **Today** (the day's cards and one-tap logging), **Week**, **Progress** (the Shell honeycomb calendar,
  test trends, milestones, the At-99 board), **Library** (every exercise with its why and sources) and **Settings**
  (backup, reminders, profile).
- A full-screen **session player** with timers and sound cues, and a **test wizard** for the Tortoise Test.
- A forgiving streak: a 15-minute **Shell day** counts, and only two missed days in a row break it.

### 2. [Exercise plan](2-exercise-plan.md)

- Equipment: one pair of fixed dumbbells, a jump rope, and playground bars on outdoor days. Nothing to buy.
- Every day: a 15-minute **morning block** (straight back, wrists, handstand practice, balance), then a main session of
  about 45 minutes, ending with a split block.

  | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
  |---|---|---|---|---|---|---|
  | Strength A | Easy run | Strength B | Intervals | Strength C | Long outdoor run + playground | Light: walk + flexibility |

- About 7½ hours in a full week. Every fourth week is light. The **Tortoise Test** comes every 12 weeks, and progression
  ladders carry every exercise forward for decades.
- Every number taken from evidence names a source in [sources.md](sources.md); the plan's own choices are marked
  *our rule*.

### 3. [Implementation](3-implementation.md)

| Phase | Builds |
|---|---|
| 0 | Scaffold and guardrails |
| 1 | The plan as data |
| 2 | Storage and core logic |
| 3 | Today and Week |
| 4 | Session player |
| 5 | Library and content |
| 6 | Tests, progress and milestones |
| 7 | Settings, backup and reminders |
| 8 | Deploy, install and the real-phone check |
| 9 | Later, optional extras |

The stack is React 19, TypeScript, Vite, Tailwind, TanStack Router, zod, Vitest, Playwright (WebKit) and GitHub Pages.

### Alongside

- [Decisions](decisions.md): every choice, who made it, and why.
- [Sources](sources.md): the studies and guidelines behind every number.

## Constraints

| | |
|---|---|
| Equipment | One fixed dumbbell pair (7–15 kg each), a jump rope, playground or park bars, a wall, a chair, a sofa, the floor |
| Time | About 60–70 min on weekdays (15 in the morning, the rest later), 1.5–2 h on Saturday, about 45 min plus a walk on Sunday; the 15-minute Shell day when needed |
| Outdoors | Runs outside whenever the weather allows; the rope indoors otherwise |
| Phone | iPhone, with the app installed from Safari |
| Privacy | The repo is public, so it holds no personal facts. Personal data lives only on the phone |

## Status

- **2026-11-21:** the plan is written: these documents, plus `CLAUDE.md` and `README.md` at the repo root. There is no code
  yet, by the owner's instruction (D-021).
- **2026-11-21, review:** every document was checked against the others, and every source was read again in its raw
  text. The evidence wording was tightened, the weekly hours were recounted, and gaps in the rules were closed (D-029
  to D-035).
- **2026-11-22:** the owner started the building ("implement phase 0 to 3"). Phases 0 to 3 are done: the scaffold and
  its guardrails, the plan as data, the storage and core logic, and the Today and Week screens.
- **2026-11-22, later:** the owner asked for all the remaining phases. Phases 4 to 7 are done (the session player, the
  library, the Tortoise Test and Progress, settings with backup and reminders), and Phase 9's offline parts (spoken
  coaching, progress photos). CI/CD now runs twice a day and by hand, never on a push (D-039). Next is Phase 8: the
  domain, the first deployment and the checks on the phone.
