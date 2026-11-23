# 3 · Implementation plan

**Status (2026-11-22):** building. The owner started Phase 0 on 2026-11-22 (D-021); Phases 0 to 7 are done, and Phase 9's
offline parts. Phase 8 waits for the owner: the domain steps, the first deployment and the real-phone checklist.

This plan turns [1-app-design.md](1-app-design.md) and [2-exercise-plan.md](2-exercise-plan.md) into a working iPhone app
in nine phases, 0 to 8, with an optional Phase 9 for later extras. Each phase ends in something that runs and is tested.

---

## 1. Stack

(D-016) Aligned with the owner's existing React frontend, minus what an offline single-user app does not need. The
version numbers are that frontend's on 2026-11-21. Phase 0 pins whatever is current when it starts (Vitest 5 and
TypeScript 7 were already out on that day) and writes the pinned versions into D-016.

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
| Unit and component tests | Vitest 4, Testing Library, jsdom, fake-indexeddb | The owner's existing stack; fake-indexeddb runs the real database code under Node |
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
│  ├─ component/  guard/     Vitest
│  └─ e2e/                   Playwright (WebKit, iPhone profile)
└─ .github/workflows/        ci.yml (the gates side by side, then GitHub Pages; D-039, D-046)
```

---

## 3. Working rules for every phase

- **Before a phase starts:** write its entry in `ai/resume.md` (the owner's global §0). Update it after every step, and
  commit by pathspec, one item at a time.
- **Test first** for every logic module: calendar, streak, progression, calculations, migrations, backup, iCalendar.
- **Gates, run once at the end of each phase:** `pnpm check` (Biome + tsc) → `pnpm test` → `pnpm build` → `pnpm e2e`,
  chained with `&&` so that a failing gate stops the chain.
- **Guard tests** (Phase 0) stay green forever:
  - no personal terms in committed text, `ai/` included (public repo). The banned list is committed only as keyed
    hashes (HMAC-SHA-256). The key stays outside the repo, in an untracked local file and in a CI secret, because a
    plain hash of a city or a first name falls to a dictionary attack (D-034). A local run without the key fails; a CI
    run without the secret, such as a fork's pull request, reports the test as skipped;
  - no CJK characters in committed text (English-only rule);
  - no grey utility classes (`gray-`, `slate-`, `zinc-`, `neutral-`, `stone-`) outside disabled styles;
  - the docs hold together: every cited source id is defined in [sources.md](sources.md) and every source is cited;
    every relative link and anchor resolves; every D-number mentioned is defined.
- **Docs and data change together:** from Phase 1 on, a change to the exercise plan updates
  [2-exercise-plan.md](2-exercise-plan.md), the plan data and, for a number, [sources.md](sources.md), in one commit.
- **Decisions:** every new construction choice gets a D-number in [decisions.md](decisions.md).
- **What is on `main` gets published** once Phase 8 exists: the next scheduled CI/CD run (twice a day) or a manual
  run deploys it (D-039). So a push to `main` waits for the owner's yes in a picker.

---

## 4. Phases

Sizes are relative: S is small, M medium, L large.

### Phase 0 — Scaffold and guardrails (S)

**Goal:** an empty app that builds, tests, installs and works offline, with every guardrail in place.

- pnpm project; Vite + React 19 + TypeScript (strict); Tailwind 4 with the design tokens (light and dark); Biome; Vitest
  with jsdom; Playwright with WebKit and an iPhone profile (rendered at 1x on CI, D-049).
- The folder layout of §2 and the `cn()` helper.
- PWA basics:
  - a manifest: name "Tortoise", start URL `/`, standalone display, theme and background colours, icons at 192 and 512 px
    and a maskable one;
  - the Apple touch icon and iOS meta tags;
  - the service worker skeleton with its build-time precache list and an update banner.
- A Content Security Policy meta tag in the production build ([design §11](1-app-design.md#11-privacy-and-security)).
  The dev server needs inline scripts, so the tag is not served there.
- The guard tests (§3).
- CI workflow: check, test, build and e2e on every push and pull request. Deploy workflow: build, then GitHub Pages. It
  is written now with a manual trigger only. *Since D-039 both are one workflow, `ci.yml`, run twice a day and by hand;
  no push starts it. Since D-046 its gates run as parallel jobs, the e2e tests in three shards.*
- `CLAUDE.md` gets the real commands.

**Done when:** the gates pass; the local preview is installable (manifest and service worker valid); and the WebKit e2e
smoke test loads the app with the network off.

**Done (2026-11-22):** all four gates pass; the WebKit smoke test checks the manifest, the icons and the security
policy, then reloads the app with the network off (proved by a fetch that fails) and serves it from the service worker.

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
  | habits | §6.10 |
  | block rules, Week 0, the ramp and interval stages | §2, §6.7, §8–§9 |
  | tests | §10 |
  | milestones and the At-99 board | §11 |
  | start rules | §8 |

- zod schemas, and content tests ([design §7](1-app-design.md#7-plan-content-model-static-shipped-with-the-app)): unique
  ids, references that resolve, digits that name sources, every source used, minutes per day within the plan's ranges.
- A read-only debug screen that draws the full week from the data.

**Done when:** the content tests pass, and the debug week matches the plan's tables, checked by hand.

**Done (2026-11-22):** the plan lives in `src/data/` (78 exercises, 14 ladders, 11 sessions, 13 tests, 44 milestones,
all 45 sources used). `tests/content/` checks the rules of design §7, and also that every copied text appears word
for word in the plan unless it is listed as composed, with a reason. `/debug/week` draws the week from the data. The
encoding choices where the plan left a gap are D-038.

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
  - the streak: one missed day, two in a row, paused days between two missed days, the days before Week 0;
  - performance with a 22,000-day history.

**Done when:** all logic tests pass; the database tests pass on fake-indexeddb, including a migration fixture; and the
daylight results match NOAA's published values for the test dates.

**Done (2026-11-22):** the logic lives in `src/lib/` and its tests in `tests/unit/` and `tests/db/`. Dates are whole day
numbers, never instants, and the tests run in a zone with daylight saving. The daylight module matches the values in
NOAA's published year spreadsheet (its own example: 40° N, 105° W, 2010) to within a minute on nine dates, and the
design's Greenwich mock to the minute (D-037). The migration fixture upgrades a version-1 database through a test
migration and keeps its records; 22,000 days are written and read in one test.

### Phase 3 — Today and Week (M)

**Goal:** the daily loop works without the player.

- The tab bar; safe-area layout; light and dark themes.
- The first run: the install hint and the start Monday ([design §3.8](1-app-design.md#38-first-run)).
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

**Done (2026-11-22):** `tests/e2e/daily-loop.spec.ts` runs a week of Week 0 with the network off and a fixed clock: a
full day, a Shell day, a sick day bridged as paused, one missed day bridged, then two missed days ending the run; the
Week tab's marks and the longest streak match. A second test edits a past day and swaps two days with the rule
warning. `tests/e2e/screens.spec.ts` takes the screenshots, light and dark. The player's **Start** buttons come with
Phase 4; the Progress, Library and Settings tabs hold only what Phase 3 needs until their phases (D-037).

### Phase 4 — Session player (L)

**Goal:** guided sessions with timers and cues.

- The step engine: session + current levels + the week's type → steps, with the light-week changes and the interval
  stages applied.
- Step kinds: reps, hold, interval, timed, stretch.
- Timers based on timestamps, so they catch up after the app returns from the background.
- Sound: audio unlocked on Start; tones; optional spoken cues.
- Screen: the wake lock, held by the root layout whenever the app is open (D-050).
- Feedback after each exercise, the end summary, and saving the logs.

**Done when:** the step-engine unit tests pass; e2e tests with a fake clock run Strength A and a 4 × 4 session; and on the
iPhone, sound, wake lock and background catch-up have been checked by hand.

**Done (2026-11-22), apart from the phone:** `src/lib/player.ts` builds the units and runs the timelines;
`tests/unit/player.test.ts` covers pairs, Week 0, the ramp, the light week, the interval stages, run–walk levels, holds,
stretches, Friday's level offset and the timeline arithmetic. `tests/e2e/player.spec.ts` runs Strength A on a fake
clock (the rest timer, the pair, saving the logs and the card) and the 4 × 4 (work and rest, a
10-minute jump standing in for the background, pause). Today's cards have **Start**; the player is full screen
(`/play/<date>/<slot>`). Construction choices: D-040. Sound, speech, wake lock and background catch-up on the iPhone
are in the Phase 8 checklist.

### Phase 5 — Library and content (M)

**Goal:** every exercise fully explained.

- Library: list, search and filters; exercise pages with ladder, history and sources; source detail.
- Video links, never embeds:
  - health bodies first, as on the Straight Back page;
  - for handstand and split drills, the most reputable teaching video found, recorded with the title and channel that
    YouTube's oEmbed returns;
  - each link checked to play.

**Done when:** every exercise has how, cue, mistake and why; every link is verified; the content tests pass.

**Done (2026-11-22):** all 78 exercises have how, cue, mistake and why (the schema requires the why;
`tests/content/library.test.ts` checks the four texts and the plan's new why table). 48 exercises link to a video or
page, each checked that day (YouTube oEmbed 200, or HTTP 200), and 30 have none, listed in `src/data/videos.ts`
(D-043). The Library has search, area and video filters, exercise pages with the ladder, history and sources, and a
source view. `tests/component/library.test.tsx` drives search and filters in a memory router;
`tests/e2e/library.spec.ts` searches and opens an exercise page with the network off, and takes the screenshots, light
and dark.

### Phase 6 — Tests, progress and milestones (L)

**Goal:** the long view.

- The test wizard: Day 1 and Day 2, resumable; the calculators; starting levels in Week 0.
- Progress: the Shell honeycomb, the numbers, SVG trend charts with aim lines, level step charts, the milestone grid, and
  the At-99 board.

**Done when:**
- e2e: a completed Week 0 test sets the starting levels;
- milestones are awarded correctly from fixtures;
- the charts render with 0, 1 and 300 tests (60 years of tests is about 260).

**Done (2026-11-22):** the wizard (`/test/<Day 1 date>`) opens from the test-day cards and from Progress; it has the
stopwatches (the mile, the 15-s pulse, one-leg stance capped at 60 s, the hang, the farmer and squat holds), the
sit-to-rise steppers, the Rockport estimate with the age range flag, the height check against the tallest earlier record
(asked once 48 weeks have passed) and Week 0's three start questions. `tests/e2e/test-wizard.spec.ts` completes Week 0's
test, sees the starting levels on Week 1's cards and the results on Progress. `tests/db/test-repo.test.ts` covers the
records, the starting levels and milestones awarded from fixtures; `tests/component/trend-chart.test.tsx` renders 0, 1
and 300 tests. Progress has the Shell, the numbers and the minutes per pillar, the milestones (next up and earned), the
At-99 board, the test trends with aim lines and the level steps. Construction choices: D-041.

### Phase 7 — Settings, backup and reminders (M)

*Since D-053 the reminders, the daylight location and the habits are gone from the app; this phase's record below
is kept as it was built.*

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

**Done (2026-11-22):** Settings has every section of [design §3.7](1-app-design.md#37-settings) (D-042).
- `tests/e2e/settings.spec.ts` (WebKit, iPhone profile):
  - export → reset (type DELETE) → import with Replace gives the identical database, every store compared; merging
    the same file again writes nothing;
  - a file that is not JSON, not a backup, damaged or from a newer app is refused with its own message, and nothing
    changes;
  - the backup goes out through a share sheet that takes files (a stub) or as a download;
  - the calendar file is downloaded and checked; the backup reminder appears on Today on Week 0's thirtieth day and
    goes once a backup is made;
  - screenshots, light and dark.
- Unit tests cover the iCalendar text (folding at 75 octets without splitting a character, CRLF line ends, escaping,
  floating times, weekly rules and alarms) and the backup validation, preview and reminder. Database tests run the
  round trip, Merge, Replace and a failed import that writes nothing.
- **Left for the real phone (Phase 8):** whether the share sheet saves the backup to Files and whether the calendar
  file reaches the iPhone Calendar, through the share sheet or by opening the file, from the home-screen app. The
  reminder times are listed as text in case neither works.

### Phase 8 — Deploy, install and the real-phone check (S)

**Goal:** the app live at its permanent address and installed on the phone.

**The domain, in this order** (one time, and only when Phase 8 begins). GitHub's documentation says to add the custom
domain to the Pages site before the DNS record exists: a record that points at GitHub before any site has claimed the
name lets someone else's site claim it (D-035).

| # | Who | Step |
|---|---|---|
| 1 | Owner | If doctornova.net is not yet verified for GitHub Pages in the GitHub account settings, verify it with the TXT record GitHub shows. A verified domain and its immediate subdomains can be published only from this account's repositories |
| 2 | Builder, on the owner's yes | Repo settings → Pages: source "GitHub Actions"; custom domain `tortoise.doctornova.net` |
| 3 | Owner | In GoDaddy's DNS for doctornova.net, add a CNAME record: host `tortoise`, value `mortal-dog.github.io` (the same shape as the existing `money` record) |
| 4 | Builder | Tick "Enforce HTTPS" once GitHub has issued the certificate |

- With an Actions deployment the custom domain lives in the Pages settings; a `CNAME` file is not used.
- Source, read in its raw text on 2026-11-21: GitHub Docs,
  [Managing a custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
  and
  [Verifying your custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages).

**Releases:** from Phase 8 on, what is on `main` is published by the next scheduled CI/CD run (13:07 and 23:07 UTC) or a
manual run (`gh workflow run ci.yml`), once the gates pass (D-039). So each push to `main` waits for the owner's yes in
a picker.

**The real-phone checklist** (on the iPhone, from Safari):

| Area | Check |
|---|---|
| Install | Add to Home Screen; opens full screen; the home-screen app starts with its own empty data |
| Offline | Works in airplane mode after the first load |
| Update | A new deploy shows the update banner, and the new version loads after a tap |
| Sound | Cues with the ring/silent switch on and off; a spoken cue |
| Screen | Wake lock in the installed app, held whenever the app is open |
| Background | Timers catch up after locking the phone mid-interval |
| Backup | Export through the share sheet to Files; import back |
| Layout | Safe areas, dark mode, larger text |
| Glass | With the moving backdrop (D-048): scrolling and the player stay smooth, and the phone does not grow warm over a full session. CI draws the glass without a GPU and found it costly per pixel (D-049), so this is the check that counts. With Reduce Transparency on (Settings → Accessibility → Display & Text Size), the panels turn solid |

**Other platforms** (D-047), on whatever devices are at hand:

| Where | Check |
|---|---|
| Android, Chrome | The first run shows **Install Tortoise**; it installs; the same address in a tab then says the app is installed and where it is |
| Desktop, Chrome or Edge | **Install Tortoise** installs and opens the app window; the address in a tab then shows **Open Tortoise**, which brings the app window forward (a running session keeps going) |
| Any browser | The welcome screen's directions match what the browser shows |

**Done when:** the checklist passes on the phone, and the results are written into this file.

### Phase 9 — Later, optional (only when the owner asks)

- A weather hint for outdoor days, only if Environment and Climate Change Canada's official API can be called from a
  browser (to be checked then), with a city-level location and off by default (D-020).
- Progress photos kept on the phone.
- Spoken coaching for whole sessions.

**Done (2026-11-22), the offline parts (D-044):** spoken coaching in the player, and progress photos on Progress (a new
store, in backups too; `tests/e2e/photos.spec.ts` adds, keeps and deletes one offline). The weather hint is left out by
the owner's choice (D-045): the official API answers browsers, but it would be the app's first third-party request.

---

## 5. Testing strategy

| Level | Tool | Covers |
|---|---|---|
| Unit | Vitest | Calendar, streak, progression, calculations, daylight, iCalendar, backup validation, milestones |
| Content | Vitest + zod | The plan data's rules ([design §7](1-app-design.md#7-plan-content-model-static-shipped-with-the-app)) |
| Database | Vitest + fake-indexeddb | Stores, transactions, migrations with fixtures |
| Component | Vitest + Testing Library | Cards, player steps, wizard steps, settings forms |
| End-to-end | Playwright, WebKit, iPhone profile | Daily loop, player with a fake clock, test wizard, backup round trip, offline mode |
| Real phone | Phase 8 checklist | What emulation cannot show: sound, wake lock, install, share sheet, Calendar |

---

## 6. Risks and how the plan meets them

| Risk | Mitigation |
|---|---|
| Losing the data on the phone (app deleted, storage cleared) | Persistent storage, asked for when the plan starts; the 30-day backup reminder; one-tap export |
| iOS web-app quirks (sound, wake lock, background) | Every cue also on screen; timers from timestamps; real-phone checks in Phases 4 and 8 |
| Playwright's WebKit cannot serve the app from its service worker with the network off | Checked in Phase 0: WebKit does serve it, so the offline test runs on WebKit (D-036). The phone check of Phase 8 still covers Safari |
| A new address would strand the data | The address is fixed (D-010); the custom domain lets the host change without changing the address |
| The data drifting from the plan | Phase 1 content tests; the rule that docs and data change in one commit |
| Personal facts leaking into the public repo | The guard test, with its list kept as keyed hashes (D-034); the `CLAUDE.md` rule; ai/ files reviewed before each commit |
| Scope creep (nutrition, social, sync) | Scope decision D-001 and the out-of-scope list ([design §14](1-app-design.md#14-out-of-scope-and-later)) |
| DNS or Pages misconfiguration | The Phase 8 steps in their order; domain verification against takeover (D-035) |
| Supply chain | Five runtime dependencies; a lockfile; the Content Security Policy blocks third-party requests |

---

## 7. Definition of done, for every phase

- All gates green, including e2e on WebKit's iPhone profile.
- No new runtime dependency without a decision entry.
- The design, plan and decision docs updated to match what was built.
- The phase's handoff entry closed.
