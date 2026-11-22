# 3 · Implementation plan

**Status (2026-11-21):** planning only. No code is written until the owner starts Phase 0 (D-021).

This plan turns [1-app-design.md](1-app-design.md) and [2-exercise-plan.md](2-exercise-plan.md) into a working iPhone app
in nine phases. Each phase ends in something that runs and is tested.

---

## 1. Stack

(D-016) Aligned with the owner's existing React frontend, minus what an offline single-user app does not need.

| Concern | Choice | Why |
|---|---|---|
| Language | TypeScript, strict | Types for the plan data and the stored records |
| UI | React 19 | The owner's existing stack |
| Build | Vite 8 | Fast; static output for GitHub Pages |
| Styling | Tailwind CSS 4, theme tokens as CSS variables; a small first-party `cn()` to join class names | Tokens from the design ([§12](1-app-design.md#12-visual-design)); no grey |
| Routing | TanStack Router, file-based and typed | The owner's existing stack; typed routes and search params |
| Validation | zod 4 | Plan data at start-up and in tests; backup files on import |
| Storage | IndexedDB through a small first-party wrapper | Auditable, about 100 lines; no Dexie |
| Offline | A first-party service worker; a small Vite plugin writes the precache list at build | Auditable; no Workbox (D-017) |
| Charts | Hand-made SVG | A few small charts; no chart library (D-019) |
| Icons | lucide-react | The owner's existing stack; static SVG |
| Lint and format | Biome | The owner's existing stack; never apply `--unsafe` fixes unread |
| Unit and component tests | Vitest 4, Testing Library, jsdom, fake-indexeddb | |
| End-to-end tests | Playwright with WebKit and an iPhone device profile | WebKit is the engine closest to iPhone Safari |
| Package manager | pnpm | The owner's existing stack |
| Hosting | GitHub Pages from this public repo, custom domain tortoise.doctornova.net | Public repos use no billed Actions minutes on standard runners |

**Runtime dependencies:** react, react-dom, @tanstack/react-router, zod, lucide-react. Nothing else ships to the phone.

---

## 2. Repository layout (planned)

```
tortoise/
├─ CLAUDE.md                 rules for AI sessions in this repo
├─ README.md
├─ docs/                     the plan (this folder)
├─ ai/                       handoff sheet; now.md and memory/ (written only by compact-ai)
├─ public/                   icons, manifest, robots.txt
├─ src/
│  ├─ routes/                screens (TanStack Router, file-based)
│  ├─ components/            cards, timers, charts, tab bar
│  ├─ data/                  plan.ts (the plan as data), sources.ts, schema.ts
│  ├─ lib/                   db, calendar, streak, progression, daylight, rockport, units, ics, backup, milestones
│  ├─ player/                session step engine and step views
│  └─ sw/                    service worker source
├─ tests/
│  ├─ unit/  content/  db/   Vitest
│  └─ e2e/                   Playwright (WebKit, iPhone profile)
└─ .github/workflows/        ci.yml, deploy.yml
```

---

## 3. Working rules for every phase

- **Before a phase starts:** write its entry in `ai/resume.md` (the owner's global §0). Update it after every step, and
  commit by pathspec, one item at a time.
- **Test first** for every logic module: calendar, streak, progression, calculations, migrations, backup, iCalendar.
- **Gates, run once at the end of each phase:** `pnpm check` (Biome + tsc) → `pnpm test` → `pnpm build` → `pnpm e2e`,
  chained with `&&` so that a failing gate stops the chain.
- **Guard tests** (Phase 0) stay green forever:
  - no personal terms in committed text (public repo);
  - no CJK characters in committed text (English-only rule);
  - no grey utility classes (`gray-`, `slate-`, `zinc-`, `neutral-`, `stone-`) outside disabled styles.
- **Docs and data change together:** from Phase 1 on, a change to the exercise plan updates
  [2-exercise-plan.md](2-exercise-plan.md), the plan data and, for a number, [sources.md](sources.md), in one commit.
- **Decisions:** every new construction choice gets a D-number in [decisions.md](decisions.md).
- **A push to `main` publishes the site** once Phase 8 exists, so it waits for the owner's yes in a picker.

---

## 4. Phases

Sizes are relative: S is small, M medium, L large.

### Phase 0 — Scaffold and guardrails (S)

**Goal:** an empty app that builds, tests, installs and works offline, with every guardrail in place.

- pnpm project; Vite + React 19 + TypeScript (strict); Tailwind 4 with the design tokens (light and dark); Biome; Vitest
  with jsdom; Playwright with WebKit and an iPhone profile.
- The folder layout of §2 and the `cn()` helper.
- PWA basics:
  - a manifest: name "Tortoise", start URL `/`, standalone display, theme and background colours, icons at 192 and 512 px
    and a maskable one;
  - the Apple touch icon and iOS meta tags;
  - the service worker skeleton with its build-time precache list and an update banner.
- A Content Security Policy meta tag ([design §11](1-app-design.md#11-privacy-and-security)).
- The guard tests (§3).
- CI workflow: check, test, build and e2e on every push and pull request. Deploy workflow: build, then GitHub Pages; it is
  written now and first runs in Phase 8.
- `CLAUDE.md` gets the real commands.

**Done when:** the gates pass; the local preview is installable (manifest and service worker valid); and the WebKit e2e
smoke test loads the app with the network off.

### Phase 1 — The plan as data (M)

**Goal:** the whole exercise plan in one typed, validated data module.

- Encode [2-exercise-plan.md](2-exercise-plan.md):

  | Data | From the plan |
  |---|---|
  | sources | [sources.md](sources.md) |
  | exercises | Appendix A |
  | ladders | §7 |
  | sessions | §6 |
  | week template | §5 |
  | block rules and interval stages | §8–§9 |
  | tests | §10 |
  | milestones | §11 |
  | start rules | §8 |

- zod schemas, and content tests ([design §7](1-app-design.md#7-plan-content-model-static-shipped-with-the-app)): unique
  ids, references that resolve, digits that name sources, every source used, minutes per day within the plan's ranges.
- A read-only debug screen that draws the full week from the data.

**Done when:** the content tests pass, and the debug week matches the plan's tables, checked by hand.

### Phase 2 — Storage and core logic (M)

**Goal:** every rule of the app as pure, tested functions, and the database under them.

- The IndexedDB wrapper: open, versioned upgrades with migrations, typed get / put / query, and transactions. The stores
  of [design §6](1-app-design.md#6-data-model-indexeddb-database-tortoise); a request for persistent storage.
- Logic modules:
  - the plan calendar (week, block, light and test weeks, interval stage) and the light-week changes;
  - day status and the tortoise streak; progression suggestions;
  - units, HRmax, Rockport, sit-to-rise;
  - daylight from NOAA's solar equations; pillar minutes; the milestone engine.
- Edge-case tests:
  - dates: daylight-saving changes, year ends, 29 February, Week 0;
  - local calendar dates rather than UTC instants;
  - performance with a 22,000-day history.

**Done when:** all logic tests pass; the database tests pass on fake-indexeddb, including a migration fixture; and the
daylight results match NOAA's published values for the test dates.

### Phase 3 — Today and Week (M)

**Goal:** the daily loop works without the player.

- The tab bar; safe-area layout; light and dark themes.
- Today:
  - the cards, with "Done as planned";
  - Shell day and the habits;
  - the outdoor/indoor switch;
  - banners: light or test week, yesterday, level-up;
  - the day ring and the daylight strip.
- Week: statuses, swaps with rule warnings, and day detail with editing.

**Done when:** e2e tests log a full day, a Shell day and a sick day, and the streak numbers match the rules
([design §5.2](1-app-design.md#52-day-status-and-the-tortoise-streak)). It all works offline. Screenshots in the iPhone
profile have been reviewed.

### Phase 4 — Session player (L)

**Goal:** guided sessions with timers and cues.

- The step engine: session + current levels + the week's type → steps, with the light-week changes and the interval
  stages applied.
- Step kinds: reps, hold, interval, timed, stretch.
- Timers based on timestamps, so they catch up after the app returns from the background.
- Sound: audio unlocked on Start; tones; optional spoken cues.
- Screen: wake lock and the pocket lock.
- Feedback after each exercise, the end summary, and saving the logs.

**Done when:** the step-engine unit tests pass; e2e tests with a fake clock run Strength A and a 4 × 4 session; and on the
iPhone, sound, wake lock and background catch-up have been checked by hand.

### Phase 5 — Library and content (M)

**Goal:** every exercise fully explained.

- Library: list, search and filters; exercise pages with ladder, history and sources; source detail.
- Video links, never embeds:
  - health bodies first, as on the Straight Back page;
  - for handstand and split drills, the most reputable teaching video found, recorded with the title and channel that
    YouTube's oEmbed returns;
  - each link checked to play.

**Done when:** every exercise has how, cue, mistake and why; every link is verified; the content tests pass.

### Phase 6 — Tests, progress and milestones (L)

**Goal:** the long view.

- The test wizard: Day 1 and Day 2, resumable; the calculators; starting levels in Week 0.
- Progress: the Shell honeycomb, the numbers, SVG trend charts with aim lines, level step charts, the milestone grid, and
  the At-99 board.

**Done when:**
- e2e: a completed Week 0 test sets the starting levels;
- milestones are awarded correctly from fixtures;
- the charts render with 0, 1 and 200 tests.

### Phase 7 — Settings, backup and reminders (M)

**Goal:** the app can be trusted with decades of data.

- Settings, every section ([design §3.7](1-app-design.md#37-settings)).
- Backup:
  - export through the share sheet with files, falling back to a download;
  - import with validation, a preview, and merge or replace;
  - the 30-day backup reminder.
- The calendar file: iCalendar (RFC 5545) with weekly repeating events, alarms and floating local times. Tests cover line
  folding, CRLF line ends and escaping.
- Reset.

**Done when:**
- a round trip (export → wipe → import) gives identical data;
- malformed files are refused with a clear message;
- the calendar file imports into the iPhone Calendar.

### Phase 8 — Deploy, install and the real-phone check (S)

**Goal:** the app live at its permanent address and installed on the phone.

**Owner steps** (one time):

| # | Step |
|---|---|
| 1 | In GoDaddy's DNS for doctornova.net, add a CNAME record: host `tortoise`, value `mortal-dog.github.io` (the same shape as the existing `money` record) |
| 2 | If doctornova.net is not yet verified for GitHub Pages in the GitHub account settings, verify it with the TXT record GitHub shows. This protects the subdomain from takeover |

**Repo setup:**
- Settings → Pages: source "GitHub Actions"; custom domain `tortoise.doctornova.net`; "Enforce HTTPS" once the
  certificate is issued.
- With an Actions deployment the custom domain lives in the Pages settings; a `CNAME` file is not used.

**Releases:** the first push to `main` goes out after the owner's yes in a picker, because it publishes.

**The real-phone checklist** (on the iPhone, from Safari):

| Area | Check |
|---|---|
| Install | Add to Home Screen; opens full screen |
| Offline | Works in airplane mode after the first load |
| Sound | Cues with the ring/silent switch on and off |
| Screen | Wake lock in the installed app; the pocket lock |
| Background | Timers catch up after locking the phone mid-interval |
| Backup | Export through the share sheet to Files; import back |
| Reminders | The calendar file imports and rings |
| Storage | Persistent storage reported |
| Layout | Safe areas, dark mode, larger text |

**Done when:** the checklist passes on the phone, and the results are written into this file.

### Phase 9 — Later, optional (only when the owner asks)

- A weather hint for outdoor days, only if Environment and Climate Change Canada's official API can be called from a
  browser (to be checked then), with a city-level location and off by default (D-020).
- Progress photos kept on the phone.
- Spoken coaching for whole sessions.

---

## 5. Testing strategy

| Level | Tool | Covers |
|---|---|---|
| Unit | Vitest | Calendar, streak, progression, calculations, daylight, iCalendar, backup validation, milestones |
| Content | Vitest + zod | The plan data's rules ([design §7](1-app-design.md#7-plan-content-model-static-shipped-with-the-app)) |
| Database | Vitest + fake-indexeddb | Stores, transactions, migrations with fixtures |
| Component | Vitest + Testing Library | Cards, player steps, wizard steps, settings forms |
| End-to-end | Playwright, WebKit, iPhone profile | Daily loop, player with a fake clock, tests wizard, backup round trip, offline mode |
| Real phone | Phase 8 checklist | What emulation cannot show: sound, wake lock, install, share sheet, Calendar |

---

## 6. Risks and how the plan meets them

| Risk | Mitigation |
|---|---|
| Losing the data on the phone (app deleted, storage cleared) | Persistent storage; the 30-day backup reminder; one-tap export |
| iOS web-app quirks (sound, wake lock, background) | Every cue also on screen; timers from timestamps; real-phone checks in Phases 4 and 8 |
| A new address would strand the data | The address is fixed (D-010); the custom domain lets the host change without changing the address |
| The data drifting from the plan | Phase 1 content tests; the rule that docs and data change in one commit |
| Personal facts leaking into the public repo | The guard test; the `CLAUDE.md` rule; ai/ files reviewed before each commit |
| Scope creep (nutrition, social, sync) | Scope decision D-001 and the out-of-scope list ([design §14](1-app-design.md#14-out-of-scope-and-later)) |
| DNS or Pages misconfiguration | The Phase 8 steps; domain verification against takeover |
| Supply chain | Five runtime dependencies; a lockfile; the Content Security Policy blocks third-party requests |

---

## 7. Definition of done, for every phase

- All gates green, including e2e on WebKit's iPhone profile.
- No new runtime dependency without a decision entry.
- The design, plan and decision docs updated to match what was built.
- The phase's handoff entry closed.
