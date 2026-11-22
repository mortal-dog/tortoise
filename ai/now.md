# Tortoise — now

<!-- Written only by the compact-ai skill. This repo is PUBLIC: project facts only, no personal facts (D-022), English
     only (the owner's words are quoted in English translation). -->

## Open work and next steps (as of 2026-11-22, 13:00 ET)

- **Nothing in flight; the handoff sheet is empty.** Every phase that code can do is built, committed and pushed to
  origin/main (owner's picker yes, 2026-11-22). The owner, 2026-11-22: "do all the remaining phases" (after "implement
  phase 0 to 3" the same morning).
- **Phase 8 is all that is left, and it waits on a deploy and on the phone:**
  1. **The first deployment has not happened yet** (the site answered 404 at 13:00 ET). The scheduled CI/CD run at
     23:07 UTC (18:07 ET) deploys it: main changed since the last green run. Or the owner clicks "Run workflow" on
     GitHub (Actions → CI/CD). A `gh workflow run ci.yml` from the session was refused by the auto-mode classifier as
     an unapproved deploy; do not retry it another way. After the run: check `https://tortoise.doctornova.net/` loads
     (HTTP 200) and that the run's deploy job ran (not skipped).
  2. **The real-phone checklist** (`docs/3-implementation.md`, Phase 8 table) is the owner's, on the iPhone from
     Safari: install, offline, the update banner, sound with the silent switch, spoken cues, wake lock and the pocket
     lock, background catch-up, backup through the share sheet to Files and back, the calendar file into Calendar,
     "Use my location once", persistent storage, layout. **When the owner reports results, write them into
     `docs/3-implementation.md` under Phase 8** (its done criterion), mark the domain steps done there, and fix what
     fails.
- **The domain steps are done** (D-035 order kept): Pages enabled with source "GitHub Actions" and custom domain
  `tortoise.doctornova.net` by the builder on the owner's yes; the owner added the GoDaddy CNAME `tortoise` →
  `mortal-dog.github.io` and the TXT `_github-pages-challenge-mortal-dog` (doctornova.net is "verified" for the
  account) and turned on "Enforce HTTPS". Checked 13:00 ET: `cname` set, `https_enforced` true,
  `protected_domain_state` verified. The TXT record must stay.
- **Owner questions left open by the agents (optional, no picker asked yet):**
  - the 44 new "why" lines and the four walking rows of Appendix A (D-043), written under the builder's delegation;
  - the backup interval choices (7, 14, 30, 60, 90 days) and whether "Not today" should hide the backup reminder for
    longer than until the app is opened again (D-042).
- **Plan gaps still encoded by their closest reading (D-038):** A0 jumps show the squat jump (ladder level 1), not the
  table's broad jump; Thursday plyometrics counted as about 3 min; no data home yet for the ramp-week effort notes, the
  rest between Day-2 tests, §9 stages to 99, §13 pain rules and §14 adaptations. Closed: (1) the walking rows (D-043)
  and (4) Friday's push-up offset (D-040).

## Standing rules (also in CLAUDE.md)

- **Gates before every code commit:** `pnpm check && pnpm test && pnpm build && pnpm e2e`, chained with `&&` (CLAUDE.md
  rule 3). `pnpm e2e` builds and serves `dist/` itself, on port 4173 or `TORTOISE_E2E_PORT` (one port per worktree;
  a running server is never reused). Last green: 242 Vitest tests in 28 files, 19 e2e tests, on `a9153fc`.
- **CI/CD (D-039):** one workflow `.github/workflows/ci.yml`, run twice a day (13:07 and 23:07 UTC) and by hand, never on
  a push or pull request. A scheduled slot works only when main changed since the workflow's last green run (GitHub's
  run history; nothing written to the repo). The gates build `dist/` once and that build deploys, from main only and
  only when GitHub Pages is set up (it is now). The owner: CI/CD "like the other repos: runs automatically twice a day,
  manual deploy supported. That saves GitHub Actions quota, and we can push any number of times without triggering a
  run." The old `deploy.yml` is gone.
- **Pushes:** compact-ai pushes `ai/` as its job; any other push to main needs a picker first, because whatever is on
  main is published by the next scheduled run (CLAUDE.md rule 8). Do not chain a commit and a push in one command.
- **The personal-term guard needs the untracked `.guard-key`** at the repo root (D-034); CI has it as the secret
  `TORTOISE_GUARD_KEY`. Copy it into an agent's worktree (never print it). Details: `ai/memory/guard-tests.md`.
- **Public repo** (`mortal-dog/tortoise`, PUBLIC): no personal facts in any committed file, including docs, code,
  tests, this file, `ai/memory/` and commit messages. Profile values live only on the phone (D-022). Times in ai/ files
  are ET only. Example data from neutral places (Greenwich, NOAA's own examples) or invented; tests run in
  `Europe/London`.
- **English only** in committed files, names included: a YouTube channel name with Arabic script keeps only its Latin
  spelling (`src/data/videos.ts`, "Aspetar").
- **Numbers need sources**, each read in its raw text (`docs/sources.md`); the plan's own choices are *our rule*. How to
  fetch: `ai/memory/reading-sources-raw.md`.
- **Docs and data change together:** a plan change updates `docs/2-exercise-plan.md`, `src/data/` and (for a number)
  `docs/sources.md` in one commit; `tests/content/verbatim.test.ts` catches drift.
- **Decisions** get a D-number in `docs/decisions.md`; **the next is D-046**. The docs guard requires the numbers with
  no gap, so parallel agents' entries are renumbered after main's at merge (done for D-042 and D-043).
- **UI:** no grey except disabled controls (no grey class exists; the `disabled` token); iPhone first; offline; **no
  third-party requests at runtime** (the owner kept this, D-045: no weather hint); English UI.
- **The weekly hours are stated in four places** that must change together: `docs/2-exercise-plan.md` §4–§5,
  `docs/plan.md`, D-009 and this page.

## Pitfalls

- **Building pitfalls** (worktrees, Biome, Playwright clocks and locators, route tree, TypeScript 7, the service
  worker, D-number merges, NOAA values, a refused deploy run): `ai/memory/building-pitfalls.md`.
- **Evidence that is easy to overstate:** `ai/memory/evidence-pitfalls.md`.
- **The address is the data:** IndexedDB belongs to the exact origin, so moving the app strands the phone's data until
  an export and import (D-010).
- **The guard key has no backup** besides the CI secret, which cannot be read back.
- **iOS web-app limits** still to verify on the phone (design §2; the Phase 8 checklist): sound after a tap and the
  silent switch, speech in the home-screen app, wake lock in home-screen mode, timers stopped in the background (the
  player catches up from timestamps), the home-screen app's separate data, the calendar file's hand-off (share sheet or
  opening the file), the share sheet to Files.
- **A level label can collide with a slot label** (A1, B2 are slots): numeric level codes read "L1", lettered ones stand
  alone ("H1", "Ba1"), in `plan-view.ts` `stepName()` and `player.ts` `levelLabel()`.

## What the app holds now (2026-11-22)

- **Today:** cards with **Start** (the player) and "Done as planned"; on test days **Start** opens the test wizard; the
  backup reminder; banners; the day ring and daylight strip.
- **Player** (`/play/<date>/<morning|main|split>`, D-040): units from `src/lib/player.ts` `buildUnits()` (pairs
  alternate and rest after each pair; level holds vs reps by the pass target; run–walk and rope levels as intervals;
  the interval stage by block; Week 0, ramp and light changes; Friday's push-up `levelOffset: 1`); timers from
  timestamps (`position()`); tones unlocked on Start (`src/lib/sound.ts`), spoken cues and spoken coaching (switch kept
  in localStorage); wake lock (`src/lib/wake-lock.ts`); pocket lock (1.5-s press); feedback; the summary saves logs and
  the card in one transaction (`repo.ts` `savePlayedSession`).
- **Library** (D-043): `library.index.tsx` (search, area and video filters kept in the address),
  `library.$exerciseId.tsx` (how, cue, mistake, why with source chips, ladder with "Set" by hand, last 10 logs, video
  link with its check date), `library.sources.$sourceId.tsx`. Every exercise has a `why` (the schema requires it); 48
  of 78 have a video link (`src/data/videos.ts`, oEmbed titles, checked 2026-11-22; the order kept by the owner,
  D-045).
- **Tortoise Test** (`/test/<Day 1 date>?day=1|2`, D-041): cards save on their own; "Finish" first saves every card
  with unsaved changes (a race the e2e test caught under load), marks the day done, sets Week 0's starting levels
  (`test-results.ts` `startingLevels()`), awards milestones. Stopwatches, the 15-s pulse count, sit-to-rise steppers,
  Rockport with the 30–69 age flag, yearly height (48 weeks), the three start questions.
- **Progress** (D-041): numbers and minutes per pillar this week; the Shell (two weeks a row); milestones (next up,
  earned; checked on open); photos (D-044: `photos` store, migration 2, JPEG ≤ 1280 px as data URLs, in backups); At
  99; test trends with aim lines (`aimLine` in `src/data/tests.ts`); level step charts; empty charts listed in one line.
- **Settings** (D-042): every section of design §3.7; backup export (share sheet or download) and import (validate,
  preview, merge by `updatedAt` or replace; schema-1 files read as having no photos); the calendar file (RFC 5545,
  floating times, weekly rules, alarms); reset (type DELETE).

## Decisions to remember (details in docs/decisions.md)

- **Goals (D-002):** at 99, a straight back and still able to jump and run; on the way, a handstand, the side split and
  the front split. Exercise only (D-001).
- **Equipment (D-003–D-006):** one fixed medium/heavy dumbbell pair (7–15 kg); a jump rope; playground bars on outdoor
  days; the owner declined the recommended pull-up bar.
- **Outdoors (D-004):** outdoor running in good weather, the rope indoors. The owner: "natural sun is important, so we
  can encourage outdoor running on a good weather".
- **Shape of the days (D-007–D-009):** a 15-min morning block plus a main session of about 45 min (50–55 on run and
  interval days); Saturday long outdoor + playground; Sunday light. **About 7½ h in a full week**, about 8 with the
  longest Saturday run; Week 0 about 5½ h, the ramp-up weeks about 6½ (set under the owner's delegation: "you arrange
  the daily intensity" and "I have time"). It is 7½, not the 7 h of the first summary.
- **App (D-010–D-014):** iPhone; the address `https://tortoise.doctornova.net`, fixed forever; data only on the phone;
  reminders by calendar file; a Shell day counts, and the streak breaks only on two missed days in a row.
- **Day status and streak (D-029):** either part alone makes a Shell day; a day with something done is never Paused;
  one missed day is bridged without counting; paused days are skipped; on a test day the test part stands in for the
  main session.
- **Other rulings:** backups merge by `updatedAt`, logs have random ids (D-032); statuses differ by shape as well as
  colour, light-theme shell `#9A6212` and sky `#2A72AB` (D-033); 4-week blocks, the test in Week 0 and every 12 weeks
  (D-015); Week 0 at half volume, all levels 1, three start questions (D-030); plan repairs (D-031).
- **Stack (D-016):** TypeScript 7.0.2, React 19.3.1, Vite 8.3.8, Tailwind CSS 4.3.5, TanStack Router 1.170.46 (plugin
  1.169.0), zod 4.6.7, lucide-react 1.77.0, Biome 2.6.8, Vitest 5.1.1, Playwright 1.65.1, jsdom 31.0.1,
  fake-indexeddb 6.2.8, Node 24, pnpm 11.20.0. First-party service worker (D-017); hand-made SVG charts (D-019).
- **Building rulings:** D-036 (Phase 0), D-037 (Phases 2–3), D-038 (Phase 1 gaps), D-039 (CI/CD, owner), D-040
  (player), D-041 (test wizard, Progress), D-042 (settings, backup, reminders), D-043 (library, content), D-044
  (spoken coaching, photos; weather not built), D-045 (owner: no weather hint; video links as chosen).

## Where things are

- `src/data/` the plan as data (`plan.ts`, `schema.ts`, `sessions.ts`, `ladders.ts`, `exercises.ts`, `videos.ts`,
  `tests.ts` with `aimLine`, `rules.ts`, `start-rules.ts`, `milestones.ts`, `at99.ts`, `rationale.ts`).
- `src/lib/` `dates`, `calendar`, `status`, `progression`, `calc`, `daylight`, `milestones`, `pillars`, `records`,
  `db` (migrations 1–2), `repo`, `live`, `plan-view`, `use-app`, `player`, `sound`, `wake-lock`, `use-now`,
  `test-results`, `test-repo`, `photos`, `library`, `backup`, `ics`, `share`.
- `src/routes/` `index.tsx` (Today), `week.tsx`, `day.$date.tsx`, `play.$date.$slot.tsx`, `test.$date.tsx`,
  `progress.tsx`, `library.index.tsx`, `library.$exerciseId.tsx`, `library.sources.$sourceId.tsx`, `settings.tsx`,
  `debug.week.tsx`; `src/components/` `player/`, `test/`, `progress/`, `settings/`; `src/sw/sw.ts`.
- `tests/` `unit`, `content`, `db`, `component`, `guard`, `fixtures`, `e2e` (`smoke`, `daily-loop`, `screens`,
  `player`, `test-wizard`, `settings`, `library`, `photos`; screenshots land in `test-results/`).
- `scripts/` `make-icons.mjs`, `guard-hash.mjs`, `guard-key.mjs`, `vite-pwa-plugin.ts`.
- Commits of 2026-11-22: `35f88ff` CI/CD, `d8e112c` Phase 4, `97cd9a1` Phase 6, `c332503` Phase 7, `7f3b5be` Phase 5,
  `a9153fc` Phase 9 offline parts, `bd7a9b8` D-045, `d2598c4` the sheet; Phases 0–3 earlier (`79befb7` … `f63c61d`).

## Background

- The repo started on 2026-11-21 as an empty public repo; the plan and its review (D-029 to D-035) landed that day and
  night. Building began 2026-11-22 with Phases 0–3, then 4–9 the same day.
- Ideas and 19 sources came from the owner's Straight Back page (<https://money.doctornova.net/posture>).
- DNS: doctornova.net on GoDaddy nameservers; `money` and `tortoise` are CNAMEs to `mortal-dog.github.io`.
