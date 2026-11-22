# Tortoise — now

<!-- Written only by the compact-ai skill. This repo is PUBLIC: project facts only, no personal facts (D-022), English
     only (the owner's words are quoted in English translation). -->

## Open work and next steps (as of 2026-11-22, 15:29 ET)

- **Nothing in flight; the handoff sheet is empty.** Everything code can do is built, committed and pushed to
  origin/main. The owner's asks of 2026-11-22: "implement phase 0 to 3", "do all the remaining phases", the install
  card and the glass look (D-047, D-048, built by parallel sessions), a faster CI/CD ("can we optimize the ci cd to
  make it faste maybe parelle? it is up to you. current speed not bad but faster is always better", D-046) and "fix
  all issues and run compact at end" (D-049).
- **The app is live** at `https://tortoise.doctornova.net` (HTTP 200). The first deploy was the owner's own manual run
  #3 on `1825aba` (13:04 ET). The live build is `af76e29`'s (the install card, the glass, the settings fix), deployed by
  a manual run at 14:49 ET on the owner's picker "Push and deploy now". The commits after it change no site files (CI,
  docs, `ai/`), so the scheduled slot at 23:07 UTC (18:07 ET) only redeploys the same files.
- **Phase 8 is all that is left: the real-phone checklist** (`docs/3-implementation.md`, Phase 8 table), the owner's,
  on the iPhone from Safari: install, offline, the update banner, sound with the silent switch, spoken cues, wake lock
  and the pocket lock, background catch-up, backup through the share sheet to Files and back, the calendar file into
  Calendar, "Use my location once", persistent storage, layout, and **Glass** (added 2026-11-22: scrolling and the
  player stay smooth with the moving backdrop on, the phone does not grow warm over a session, Reduce Transparency
  gives solid panels; CI found the glass costly per pixel without a GPU, D-049). Then **other platforms** (D-047):
  Android Chrome, desktop Chrome or Edge, and the directions in any browser. **When the owner reports results, write
  them into `docs/3-implementation.md` under Phase 8** (its done criterion), mark the domain steps done there, and fix
  what fails.
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
  a running server is never reused), at the iPhone profile's 3x unless `TORTOISE_E2E_DPR` says otherwise (CI sets 1).
  Last green: 311 Vitest tests in 33 files and 22 e2e tests on `5a32c8d`; CI green on `3fa4a81` (run 45066211124).
- **CI/CD (D-039, D-046, D-049):** one workflow `.github/workflows/ci.yml`, run twice a day (13:07 and 23:07 UTC) and
  by hand ("Run workflow", or `gh workflow run ci.yml --repo mortal-dog/tortoise`, input `deploy` true by default),
  never on a push or pull request. A scheduled slot works only when main changed since the workflow's last green run
  (GitHub's run history; nothing written to the repo); a manual run always runs in full. The gates run side by side:
  `check, test, build` (uploads `dist/` for Pages) and three e2e shards at 1x; the deploy waits for all four, from main
  only. A run takes about 1:20 to 1:50, mostly the apt install of WebKit's system libraries (23–58 s per job). The owner:
  CI/CD "like the other repos: runs automatically twice a day, manual deploy supported. That saves GitHub Actions quota,
  and we can push any number of times without triggering a run." Details and how to test a workflow change without
  deploying: `ai/memory/ci-pipeline.md`.
- **Pushes:** compact-ai pushes `ai/` as its job; any other push to main needs a picker first, because whatever is on
  main is published by the next scheduled run (CLAUDE.md rule 8). A manual run that deploys needs the owner's yes in
  this session's picker too; a run with `-f deploy=false`, or on a branch, never deploys. Do not chain a commit and a
  push in one command.
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
- **Decisions** get a D-number in `docs/decisions.md`; **the next is D-050**. Entries sit in the section of their topic
  (CI rulings under "Building and the repo"). The docs guard requires the numbers with no gap, so parallel sessions'
  entries are renumbered after main's at merge (done for D-042 and D-043; D-047 and D-048 were reserved up front).
- **Settings saves:** `saveSettings` reads and writes the record in one transaction; a nested field (reminders,
  profile, units, backup) is saved as a function of the stored record, `saveSettings((s) => ({ units: { ...s.units,
  mass: v } }))`, never spread from the rendered copy (`7f2ef15`: two times typed in a row lost the first).
- **UI:** no grey except disabled controls (no grey class exists; the `disabled` token); iPhone first, every platform
  (D-047); offline; **no third-party requests at runtime** (the owner kept this, D-045: no weather hint); English UI.
- **The weekly hours are stated in four places** that must change together: `docs/2-exercise-plan.md` §4–§5,
  `docs/plan.md`, D-009 and this page.

## Pitfalls

- **Building pitfalls** (worktrees, Biome, Playwright clocks and locators, route tree, TypeScript 7, the service
  worker, D-number merges, NOAA values, deploy runs from the session, the settings race): `ai/memory/building-pitfalls.md`.
- **The glass costs per pixel without a GPU** (D-049): CI's WebKit renders the e2e at 1x; the Mac's GPU hides that
  cost, so judge CI speed on CI. When CI slows, rerun the last fast commit as a control and bisect the commits before
  guessing at causes (three guesses came first on 2026-11-22). Numbers: `ai/memory/ci-pipeline.md`.
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

- **First run** (D-047): the install card fits the browser (`src/lib/install.ts` reads the platform from the user
  agent; `src/components/InstallCard.tsx`, `FirstRun.tsx`): Install Tortoise where Chromium offers its prompt, "Tortoise
  is installed on this device" where `getInstalledRelatedApps` can tell, written directions on Apple platforms and
  Firefox, the address to open elsewhere in web views; "Start in this browser instead" always (the e2e first runs click
  it). A Chromium browser gets 1.5 s to answer before the directions show. Manifest: `related_applications`,
  `launch_handler` `focus-existing`.
- **The look** (D-048): glass panels (`glass`, `glass-strong`, `veil` utilities in `src/styles.css`) over a backdrop
  of four soft glows drifting over 80–131 s (`src/components/Backdrop.tsx`); raindrops on a canvas on Today, Week and
  Progress, at most 24 frames a second, stopped while hidden (`src/lib/rain.ts`); a floating glass tab bar with a
  gliding pill; Settings → Display → **Moving background** (`src/lib/effects.ts`, localStorage
  `tortoise.movingBackdrop`, on by default); reduced motion keeps it still, reduced transparency gives solid panels; the
  contrast guard checks every text colour over every glow overlap.
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
  floating times, weekly rules, alarms); Display (Moving background); reset (type DELETE).

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
- **App (D-010–D-014, D-047):** the iPhone first and every platform since D-047; the address
  `https://tortoise.doctornova.net`, fixed forever; data only on the phone; reminders by calendar file; a Shell day
  counts, and the streak breaks only on two missed days in a row.
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
  (spoken coaching, photos; weather not built), D-045 (owner: no weather hint; video links as chosen), D-046 (CI gates
  side by side, actions on Node 24), D-047 (owner: every platform; the install card), D-048 (owner: the glass look),
  D-049 (CI renders the e2e at 1x).

## Where things are

- `src/data/` the plan as data (`plan.ts`, `schema.ts`, `sessions.ts`, `ladders.ts`, `exercises.ts`, `videos.ts`,
  `tests.ts` with `aimLine`, `rules.ts`, `start-rules.ts`, `milestones.ts`, `at99.ts`, `rationale.ts`).
- `src/lib/` `dates`, `calendar`, `status`, `progression`, `calc`, `daylight`, `milestones`, `pillars`, `records`,
  `db` (migrations 1–2), `repo`, `live`, `plan-view`, `use-app`, `player`, `sound`, `wake-lock`, `use-now`,
  `test-results`, `test-repo`, `photos`, `library`, `backup`, `ics`, `share`, `install`, `effects`, `rain`.
- `src/routes/` `index.tsx` (Today), `week.tsx`, `day.$date.tsx`, `play.$date.$slot.tsx`, `test.$date.tsx`,
  `progress.tsx`, `library.index.tsx`, `library.$exerciseId.tsx`, `library.sources.$sourceId.tsx`, `settings.tsx`,
  `debug.week.tsx`; `src/components/` `player/`, `test/`, `progress/`, `settings/`, `Backdrop.tsx`, `FirstRun.tsx`,
  `InstallCard.tsx`; `src/sw/sw.ts`.
- `tests/` `unit`, `content`, `db` (`settings.test.ts`: two saves at once), `component`, `guard`, `fixtures`, `e2e`
  (`smoke`, `daily-loop`, `screens`, `player`, `test-wizard`, `settings`, `library`, `photos`, `look`; screenshots land
  in `test-results/`).
- `scripts/` `make-icons.mjs`, `guard-hash.mjs`, `guard-key.mjs`, `vite-pwa-plugin.ts`.
- Commits of 2026-11-22: `35f88ff` CI/CD, `d8e112c` Phase 4, `97cd9a1` Phase 6, `c332503` Phase 7, `7f3b5be` Phase 5,
  `a9153fc` Phase 9 offline parts, `bd7a9b8` D-045; afternoon: `7f2ef15` the settings race, `e64c8ed` CI side by side
  (D-046), `856d3d7` the install card (D-047), `af76e29` the glass (D-048), `5a32c8d` CI e2e at 1x (D-049), `3fa4a81`
  the Phase 8 glass check; Phases 0–3 earlier (`79befb7` … `f63c61d`).

## Background

- The repo started on 2026-11-21 as an empty public repo; the plan and its review (D-029 to D-035) landed that day and
  night. Building began 2026-11-22 with Phases 0–3, then 4–9 the same day, then the install card, the glass and the CI
  work in parallel sessions that afternoon.
- Ideas and 19 sources came from the owner's Straight Back page (<https://money.doctornova.net/posture>).
- DNS: doctornova.net on GoDaddy nameservers; `money` and `tortoise` are CNAMEs to `mortal-dog.github.io`.
