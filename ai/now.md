# Tortoise — now

<!-- Written only by the compact-ai skill. This repo is PUBLIC: project facts only, no personal facts (D-022), English
     only (the owner's words are quoted in English translation). -->

## Open work and next steps (as of 2026-11-23, 19:03 ET)

- **Nothing in flight; the handoff sheet is empty.** All of the owner's 2026-11-23 asks are built and pushed; gates
  green on `c8f6d07`: 246 Vitest in 28 files, 16 e2e.
- **Live is `2c46e68`** (scheduled run 45287012727, 23:14 UTC, green: D-060 to D-062). **Not deployed yet:** `4dad116`
  (D-063, D-064), `6f049f2` (D-065), `447a5f6` (D-066), `3c09296` (D-067, D-068), `c8f6d07` (D-069). The next
  scheduled run (13:07 UTC 2026-11-24, 08:07 ET; GitHub starts schedules late) publishes main; his picker of 2026-11-23 evening:
  "wait for tomorrow's scheduled run" (no manual deploy). After it, check the live site: About shows "App 0.1.N (c8f6d07…)" with N = the commit
  count of main; first run shows the five start questions; no Tortoise Test anywhere; a badge tap opens its card;
  a session's summary asks the check-ins that are due.
- **D-069 (`c8f6d07`): levels move by check-ins, the owner's model** ("on first use the app asks the user's fitness
  level and starts at about the right level; when the app thinks it is time to raise the intensity it asks first …
  No editing of counts or times on the day: all fixed. Each ask also offers a lower intensity … after lowering, the
  next ask is relative to the lower level"; pickers "ask right after the session", "by type", "a few concrete yes/no
  questions"). Doses fixed in the player: no rep or weight steppers, no "Too easy / Right / Too hard", no effort or
  note on the summary (the outdoor run's distance stays: the km badges need it), no level suggestions on Today. The
  summary shows a `CheckInCard` per due ladder: Harder (next level's name) / Keep / Easier (level below); Save waits
  for every answer; `savePlayedSession` writes the levels (`askedAt`, `eased`, history) in the same transaction.
  `src/lib/progression.ts` `checkInsDue()`: due `askEveryDays` (on each ladder: strength 14, handstand-skill and
  balance 21, run 7, jumps 28) after the latest of Week 1's Monday, `askedAt`, `since`; 7 days after "Easier"
  (`EASED_DAYS`); at once, "Easier" first, after 14 days without the ladder (`TIME_OFF_DAYS`, last log date before
  today); none in Week 0; no Harder at the top, no Easier at level 1. Five start questions on the first run (choice
  buttons preset to the lowest; `src/data/start-rules.ts`): floor push-ups 0–4/5–14/15–29/30+ → Push 1–4; easy run
  not yet/~10/30+ min → R1/R4/R8; one leg 30 s → Ba2; chest-to-wall handstand 30 s → H8; lifting twice a week 3+
  months → Squat 2, Bridge 2, Row P2, Back extension 2. `startPlan` writes the levels **before** the start date (saving
  the start date ends the first run; the e2e reloaded before later writes landed and saw R1). The run–walk ladder
  could never move before (endurance steps waited for a tap the app never offered).
- **D-067 (`3c09296`): no fitness test** (owner: "what on earth is the Tortoise Test? Can we just delete all of it? If
  deleted, update the design documents too"; pickers "Delete it all", "Earn them by reaching ladder levels"). Gone:
  the wizard route and `components/test/`, test days and banners, the Progress button, the At-99 board, `tests.ts`,
  `at99.ts`, `test-results.ts`, the Rockport/sit-to-rise/height calculators, sources kline1987, brito2014, green2004,
  wiyanad2018 (oc2023 stays via a §9 rationale entry `bone-density-checks`). Week 0 is half volume all seven days
  (about 6 h, was 5½). `test-repo.ts` → `milestone-repo.ts`. The DB `tests` store and `TestRecord` stay for old data,
  no screen. Plan §10 is now "No fitness test" (numbering kept).
- **Badges now (D-058, D-066, D-067):** 41: 12 habit (Hatchling … Ancient, Bask 10/50/100/500, Road 100/500/1,000 km),
  29 ability: ladder levels (Push L3–L6, Squat L3/L5, Bridge L3/L5, Row P3, Back L3/L5, Core L3, Handstand
  H6/H8/H10/H13, Pike push S3, Balance Ba3/Ba6, Jumps L3, Run–walk R4/R8; metric `level:<ladderId>` = the highest
  level ever in the history, so a step back keeps them), Splits 10/50/100/365 (split blocks done; Sunday's Light
  counts), run logs (5 km, 10 km, 90 min). A tap opens `BadgeDialog` (portal; medal 124 px with a tier halo, Earned
  date or Locked, metal · group, "How to earn it"/"What it took", a progress bar while locked; ✕, a tap outside or
  Escape closes; focus returns to the badge); no `title` tooltips; labels one line (`label` ≤ `LABEL_MAX` 14, the e2e
  checks each fits). A level badge's progress counts from level 1. **A start answer can earn level badges at once**
  (e.g. 30+ push-ups → Push L3, L4): his picker 2026-11-23 "keep: a badge reflects the real level".
- **D-068 (owner, CLAUDE.md rule 10): before every commit, docs, code and badges agree** ("remember to keep the docs and
  the actual code in sync, and the badges too: some badges may become very hard, impossible or too easy to earn
  because of code changes. Check this before every commit; write it into a memory rule"). `tests/unit/badges.test.ts`
  checks every badge can be earned (metric computed; a level exists on a ladder the week uses, above level 1).
- **D-065 (`6f049f2`): the app's version comes from git at build time.** `vite.config.ts` sets `__APP_VERSION__` to
  package.json's major.minor plus `git rev-list --count HEAD` and `__APP_COMMIT__` to the short hash; Settings › About
  reads "App 0.1.N (abc1234) · plan 2026-11-21". CI's `check, test, build` job checks out with `fetch-depth: 0`; the e2e
  shards keep the shallow clone (their builds say 0.1.1, they never deploy). Nothing to bump before a commit; a new
  major or minor is set by hand in package.json.
- Earlier the same evening (deployed in `2c46e68` unless noted): D-056 safer, fewer exercises (80 → 48 → 35), no bar,
  no library or exercise text, one video per exercise (none for Jump rope, Run, Walk), the indoor run a 45–60 min
  brisk walk; D-057 the day page for any day, no editing, no pause, no ring; D-058 badges; D-059 the still tab bar;
  D-060 videos play in the app (`youtube-nocookie.com/embed/<id>?playsinline=1&rel=0`, only after a tap; CSP
  frame-src; CLAUDE.md rule 7's exception); D-061 48 → 35 exercises (splits 6, handstand 9 with strength track S1–S3,
  strength 10; Run–walk + Easy run = one exercise `run`); D-062 a shorter Progress (no Shell honeycomb, photos, trends,
  level charts; the photos store stays); D-063 the equipment in About and D-064 commit-push-compact (not deployed).
- **Video doubts the owner may want to look at** (the helper's notes, each video was still checked by its frames):
  push-up (WeShape, vertical, no feet-on-chair stage), split-squat (no Bulgarian), glute-bridge (no single-leg or hip
  thrust), pike-hold and pike-push-up (no feet-on-chair), front split on blocks (a Pilates slider, ends in a full
  split), the kick-up video (6 min) stands for the bail too, middle split 20 min (10:50–12:20). A 78-s chair
  middle-split video exists (`dPtCfZFauzI`, amateur channel).
- **A trade-off of D-057, told to the owner:** a past day can no longer be marked done afterwards; only the player and
  Today's "Done as planned" log.
- Earlier the same day: a
  beginner's handstand ladder (D-051), the day's timing (D-052), no pocket lock (D-050), the settings sweep (D-053),
  the Google Drive backup (D-054) and **the Drive sync as the only backup, renewing its own sign-in (D-055)**. Live
  build `687985c`, deployed by manual run 45214620004 (green) on the owner's picker "Push and deploy now"; the live
  CSP has `frame-src 'self' https://accounts.google.com`, and `/oauth-silent.html` and `/oauth-silent.js` answer 200.
- **The owner's Google Cloud steps are both done** (2026-11-23) on the French app's Web client
  (`392431386089-a3baa70ro45r5uegru6hjc23o9ptkhgj.apps.googleusercontent.com`, his picker "reuse"):
  - authorised JavaScript origin `https://tortoise.doctornova.net` (D-054), confirmed by the owner ("i confirm
    confirmed the other Google step, adding https://tortoise.doctornova.net as an authorised JavaScript origin");
  - authorised redirect URI `https://tortoise.doctornova.net/oauth-silent.html` (D-055), reported by the owner
    ("https://tortoise.doctornova.net/oauth-silent.html is done").
  - So an "origin_mismatch" in Google's window, or renewals that always wait for a tap in Chrome, would now point to
    another cause (a typo in the console entry, Google's propagation delay of a few minutes, the consent screen's test
    users). Its consent screen is in Testing (only its test users can sign in). For `pnpm dev` sign-in,
    `http://localhost:5173` would also need adding (the French client already lists it).
  - Nothing is left before the owner's Phase 8 sign-in on the phone.
- **Found in the French app, not fixed there (not asked):** its armed next-tap renewal (`~/Repo/french`
  `src/features/sync/sync.ts` `armNextTap`) listens for `pointerdown`; by the HTML spec a touch's pointerdown gives no
  user activation (only its pointerup, touchend and click), so on a phone its renewal popup is likely blocked and the
  tap marks itself refused. Tortoise listens for `click` (D-055). Told the owner 2026-11-23; neither verified on a
  phone.
- **Phase 8 is all that is left: the real-phone checklist** (`docs/3-implementation.md`, Phase 8 table), the owner's,
  on the iPhone from Safari: install, offline, the update banner, sound with the silent switch, spoken cues, the screen
  staying on whenever the app is open (D-050), background catch-up, **Google Drive** (sign in from the installed app:
  does Google's popup open and come back in home-screen mode; a change syncs within a minute and "Last sync" moves;
  after an hour, opening the app and tapping anything renews the sign-in with no other step, a window may flash and
  close; restore on a second device or after Delete all data; D-054, D-055), layout, and
  **the new screens** (badges shine and a tap opens the badge's card, closed by ✕; a name plays its video in the app;
  the tab bar stays still when tabs are tapped; the five start questions; the check-ins on a summary; D-057 to D-069),
  and **Glass** (smooth scrolling and player with the drifting backdrop, no warm phone, Reduce Transparency gives solid
  panels; D-049). Then **other platforms** (D-047): Android Chrome, desktop Chrome or Edge. **When the owner reports
  results, write them into `docs/3-implementation.md` under Phase 8** (its done criterion) and fix what fails. The
  calendar-file, location and storage rows went with D-053, the backup-file row with D-055.
- **A known limit of the sync, not asked about:** a plain sync only uploads this device's file; another device's
  changes come in only when this device signs in (first sign-in restore). Told the owner 2026-11-23.
- **Plan gaps still encoded by their closest reading (D-038):** Thursday's squat jumps counted as about 3 min; no data home yet for the ramp-week effort notes,
  §9 stages to 99 (except its bone-density rationale), §13 pain rules and §14 adaptations.
- **The domain steps are done** (D-035): Pages with source "GitHub Actions", custom domain `tortoise.doctornova.net`,
  GoDaddy CNAME `tortoise` → `mortal-dog.github.io`, TXT `_github-pages-challenge-mortal-dog` (must stay), HTTPS
  enforced.

## Standing rules (also in CLAUDE.md)

- **Gates before every code commit:** `pnpm check && pnpm test && pnpm build && pnpm e2e`, chained with `&&` (CLAUDE.md
  rule 3). `pnpm e2e` builds and serves `dist/` itself, on port 4173 or `TORTOISE_E2E_PORT` (one port per worktree;
  a running server is never reused), at the iPhone profile's 3x unless `TORTOISE_E2E_DPR` says otherwise (CI sets 1).
  Last green: 246 Vitest tests in 28 files and 16 e2e tests on `c8f6d07` (local); CI green last on `2c46e68` (run
  45287012727).
  The two heavy tests (`tests/db/db.test.ts` 60 years of days, `tests/guard/personal-terms.test.ts`) carry their own
  30-s limit since `4933a2a`: under vitest's 5-s default they failed twice while another repo's tests loaded the Mac.
  `tests/unit/dates.test.ts` (every day of 1900–2100) timed out once at 5.5 s on 2026-11-23 under load and passed on
  the rerun; give it the same 30-s limit if it fails again.
- **Docs, code and badges agree before every commit (D-068, CLAUDE.md rule 10):** read the change against plan.md and
  the docs 1–3, decisions and CLAUDE.md; check no badge becomes impossible, much harder or much easier.
- **CI/CD (D-039, D-046, D-049):** one workflow `.github/workflows/ci.yml`, run twice a day (13:07 and 23:07 UTC) and
  by hand ("Run workflow", or `gh workflow run ci.yml --repo mortal-dog/tortoise`, input `deploy` true by default),
  never on a push or pull request. A scheduled slot works only when main changed since the workflow's last green run
  (GitHub's run history; nothing written to the repo); a manual run always runs in full. The gates run side by side:
  `check, test, build` (uploads `dist/` for Pages) and three e2e shards at 1x; the deploy waits for all four, from main
  only. A run takes about 1:20 to 1:50, mostly the apt install of WebKit's system libraries (23–58 s per job). The owner:
  CI/CD "like the other repos: runs automatically twice a day, manual deploy supported. That saves GitHub Actions quota,
  and we can push any number of times without triggering a run." Details and how to test a workflow change without
  deploying: `ai/memory/ci-pipeline.md`.
- **Pushes (D-064, CLAUDE.md rule 9):** every finished job ends with commit, push to `main` and `compact-ai`, unasked,
  once the full gates are green (the owner: "every time, commit, push and compact; no special instruction from me
  needed, it is the default routine"; his picker: this repo only). A scheduled run then publishes `main`. A manual run
  that deploys still needs his yes in a picker; a run with `-f deploy=false`, or on a branch, never deploys. Do not
  chain a commit and a push in one command.
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
- **Decisions** get a D-number in `docs/decisions.md`; **the next is D-070**. Entries sit in the section of their topic
  (CI rulings under "Building and the repo"). The docs guard requires the numbers with no gap, so parallel sessions'
  entries are renumbered after main's at merge (done for D-042 and D-043; D-047 and D-048 were reserved up front).
- **Settings saves:** `saveSettings` reads and writes the record in one transaction; a nested field (profile, units)
  is saved as a function of the stored record, `saveSettings((s) => ({ units: { ...s.units,
  mass: v } }))`, never spread from the rendered copy (`7f2ef15`: two times typed in a row lost the first).
- **The sync card shows only the last sync's date and time** (D-055; the owner: "remove all other wordings. you can just
  show last sync date time. and remove wordings like 'restore merges: for each record the newer copy wins, blabla.'"):
  no explanations on it; an error line only when there is one; buttons Sign in with Google, or Sync now and Sign out.
  Keep new Drive features off that card unless he asks.
- **UI:** no grey except disabled controls and locked badges (D-058; no grey class exists; the `disabled` token); iPhone first, every platform
  (D-047); offline; **no third-party requests at runtime except Google's sign-in and Drive, only after the user signs
  in, and YouTube's no-cookie player, only after a tap on an exercise's name** (CLAUDE.md rule 7 since D-054 and
  D-060; D-045's "no weather hint" stands); English UI.
- **When in the day (D-052, owner's pickers):** the morning block after waking; the main session at lunch to
  mid-afternoon, 3–4 h after it; the split block straight after the main session in the same sitting (a drink and 2
  min of walking). The texts live in `src/data/week.ts` `dayTimes` (the "When" column of plan §4) and show on the Today
  cards.
- **Handstand skill ladder (D-051):** 14 levels, H1–H6 on the floor or low on the wall (plank on the hands, pike hold,
  pike hold feet on a chair, wall plank at knee, thigh, then hip height = the old L); the morning slot is the level's
  holds with 30-s rests, 3–6 min, not a 6-minute timer; since D-069 no feedback question; the ladder
  moves by its check-in every 3 weeks. The owner: a beginner; "the difficulty must grow slowly, not start at an expert level".
- **The weekly hours are stated in four places** that must change together: `docs/2-exercise-plan.md` §4–§5,
  `docs/plan.md`, D-009 and this page.

## Pitfalls

- **Building pitfalls** (worktrees, Biome, Playwright clocks and locators, route tree, TypeScript 7, the service
  worker, D-number merges, NOAA values, deploy runs from the session, the settings race, glass screenshots, the light
  theme's contrast margin, the sheet's empty sentinel): `ai/memory/building-pitfalls.md`.
- **The glass costs per pixel without a GPU** (D-049): CI's WebKit renders the e2e at 1x; the Mac's GPU hides that
  cost, so judge CI speed on CI. When CI slows, rerun the last fast commit as a control and bisect the commits before
  guessing at causes (three guesses came first on 2026-11-22). Numbers: `ai/memory/ci-pipeline.md`.
- **Evidence that is easy to overstate:** `ai/memory/evidence-pitfalls.md`.
- **The address is the data:** IndexedDB belongs to the exact origin, so moving the app strands the phone's data until
  an export and import (D-010).
- **The guard key has no backup** besides the CI secret, which cannot be read back.
- **iOS web-app limits** still to verify on the phone (design §2; the Phase 8 checklist): sound after a tap and the
  silent switch, speech in the home-screen app, wake lock in home-screen mode, timers stopped in the background (the
  player catches up from timestamps), the home-screen app's separate data, and Google's sign-in popup from the
  home-screen app, both from the sign-in button and from the next-tap renewal (D-054, D-055). Safari refuses Google's
  cookies in the hidden renewal frame, so on the iPhone expect every renewal to come from the next tap.
- **A level label can collide with a slot label** (A1, B2 are slots): numeric level codes read "L1", lettered ones stand
  alone ("H1", "Ba1"), in `plan-view.ts` `stepName()` and `player.ts` `levelLabel()`.

## What the app holds now (2026-11-23)

- **First run** (D-047): the install card fits the browser (`src/lib/install.ts` reads the platform from the user
  agent; `src/components/InstallCard.tsx`, `FirstRun.tsx`): Install Tortoise where Chromium offers its prompt, "Tortoise
  is installed on this device" where `getInstalledRelatedApps` can tell, written directions on Apple platforms and
  Firefox, the address to open elsewhere in web views; "Start in this browser instead" always (the e2e first runs click
  it). A Chromium browser gets 1.5 s to answer before the directions show. Manifest: `related_applications`,
  `launch_handler` `focus-existing`. Then the Monday of Week 0 and the five start questions (D-069), "Start the plan"
  below them.
- **The look** (D-048, D-053): glass panels (`glass`, `glass-strong` utilities in `src/styles.css`) over a backdrop of
  four soft glows drifting over 80–131 s (`src/components/Backdrop.tsx`); a floating glass tab bar with a gliding pill.
  No raindrops and no Display switch since D-053: the backdrop always drifts (`src/lib/effects.ts` reads only reduced
  motion), reduced transparency gives solid panels; the contrast guard checks every text colour over every glow overlap.
- **Screen awake (D-050):** the root layout (`src/routes/__root.tsx`) holds the wake lock whenever the app is open and
  shares its state through `WakeLockContext` (`src/lib/wake-lock.ts`); the player shows the Auto-Lock notice when it is
  missing or refused. No pocket lock. The owner: the lock and "Hold to unlock" felt pointless; "once the app is open the
  screen stays on, the OS cannot lock it".
- **Today:** cards with **Start** (the player) and "Done as planned", each with its time of day (D-052); the Week 0
  and light-week banners. No test card or test banners (D-067), no level suggestions (D-069), no day ring and no "Yesterday has nothing logged" banner (D-057), no habits
  card, no daylight strip (D-053), no backup reminder (D-055). Run days start at Outdoor.
- **Day page** (`/day/<date>`, D-057): the same list for any day: morning block, main session,
  split block, each step with its level name, dose and its exercise linking to YouTube (`ExerciseLink`); a future run
  day also lists "Indoors (rain or ice)". Past days (and today once a part is done) mark each step ✓ or ✗ and say
  "Nothing was done this day." when so. `plan-view.ts` `dayItems()`: a part record with `steps` counts only those
  (the player's finished, not skipped, steps; `Player.tsx` `skipped`), one without (Done as planned) counts all.
  Read only: no fields, no switches, no "Sick or injured"; no `paused` in records or statuses.
- **Player** (`/play/<date>/<morning|main|split>`, D-040): units from `src/lib/player.ts` `buildUnits()` (pairs
  alternate and rest after each pair; level holds vs reps by the pass target; run–walk and rope levels as intervals;
  the interval stage by block; Week 0, ramp and light changes; Friday's push-up `levelOffset: 1`); each exercise's name
  opens its video, no cue or "How" text (D-056); timers from
  timestamps (`position()`); tones unlocked on Start (`src/lib/sound.ts`), spoken cues and spoken coaching (switch kept
  in localStorage; it says the step and target, no cue); fixed doses, a reps step only taps "Set done" (D-069); the
  summary (time, sets, the outdoor run's distance, the due check-ins) saves logs (sets without reps), the finished
  step ids, the card and the check-ins' levels in one transaction (`repo.ts` `savePlayedSession`); the route
  `play.$date.$slot.tsx` computes `checkInsDue()` once, frozen with the units.
- **Exercises and videos** (D-056, D-060, D-061): no Library page and no exercise text; an exercise is `{id, name,
  area, unit, video?}` (`src/data/exercises.ts`, 35, well-known names); `videos.ts` holds 32 YouTube videos, each
  chosen by its storyboard frames, title, channel and length (checked 2026-11-23); `NO_VIDEO` = rope-basics, run, walk
  ("everyone knows them"); `src/components/ExerciseLink.tsx` turns a name into a button that opens the in-app video
  sheet (`videoId()`, `embedUrl()`); every exercise is used by a step or a ladder level (tested).
  Plan Appendix A is the name → video table, generated from the data and checked by `tests/content/plan.test.ts`.
  A level can no longer be set by hand (that lived in the library); the check-ins move it (D-069).
- **Progress** (D-041, D-062, D-067): numbers (streak, longest, full and Shell days this month) and minutes per pillar
  this week; milestones: next up, and **badges** (D-058: `src/lib/badges.ts`, `src/components/progress/BadgeMedal.tsx`,
  `BadgeDialog.tsx`; one per milestone, 41; a shell-hexagon SVG medal, metal by step along a ladder or metric: bronze,
  gold, jade, sapphire, Hatchling bronze, a lone one gold; earned = stored or `reached()` now; glint and sparkles in
  `styles.css`, still under reduced motion; locked grey with a lock, the owner's ask; a tap opens the card, D-066;
  milestones awarded on open, `milestone-repo.ts` `awardMilestones`). No Tortoise Test button, no At 99 (D-067). Gone by
  D-062: the Shell honeycomb, photos (the `photos` store, migration 2 and its Drive
  copy stay, D-044), test trends, level charts, the outdoor-sessions tile.
- **Settings** (D-042, D-053, D-054, D-055): Plan, Profile, Units (kg/lb, km/mi), **Google Drive sync** (only "Last
  sync: <date>, <time>"), About, Reset (type DELETE; it also forgets the Google sign-in; its text says the Drive copy
  stays when signed in, "It cannot be undone." when not). Gone: dumbbell weight, Daylight, Runs, Display, Reminders,
  Storage (D-053), the Backup file card with export, share sheet, import, preview and Replace (D-055); old records drop
  those fields, and the settings record's `backup` field, when read (zod strips unknown keys).
- **Google Drive sync (D-054, D-055), the only backup:** `src/lib/sync/google.ts` (GIS token model, scope
  `drive.appdata` + email, session in localStorage `tortoise.google`; `silentToken()` hidden-frame renew, `preloadGis()`
  once signed in), `public/oauth-silent.{html,js}` (the frame's landing page), `drive.ts` (list, read, resumable write
  in `appDataFolder`), `sync.ts` (one `device-<id>.json` per device in the backup format; `ensureToken()` → silent
  frame → `armNextTap()` on `click`/`keydown`; `autoSync()` uploads only when dirty; a device's first sync after
  sign-in restores by merge; an empty phone never uploads; status `offline` is no error),
  `src/components/settings/DriveCard.tsx`; `startAutoSync()` in `src/main.tsx`; `onChange()` in `src/lib/live.ts`;
  `mergeBackup()` in `repo.ts` (`importBackup` is merge-only). Tests: `tests/db/drive-sync.test.ts` (fake Drive,
  `resetSyncForTests(drive)`), the silent page under the service worker in `tests/e2e/smoke.spec.ts`. Details:
  `ai/memory/drive-backup.md`.

## Decisions to remember (details in docs/decisions.md)

- **Goals (D-002):** at 99, a straight back and still able to jump and run; on the way, a handstand, the side split and
  the front split. Exercise only (D-001).
- **Equipment (D-003–D-006, D-056, D-063):** a yoga mat, a jump rope and one fixed medium/heavy dumbbell pair (7–15 kg),
  listed in Settings › About from `src/data/equipment.ts`; **no bar at all**
  (the owner: "there is no bar; at home only dumbbells and a jump rope"); every pull is a one-arm dumbbell row.
- **Outdoors (D-004, D-056):** outdoor running in good weather; indoors (rain, ice) a longer brisk walk around a room,
  Tuesday 45–60 min, Saturday at most 60 min. Stairs were tried and dropped on the owner's picker after "do stairs hurt
  the knees?" (descending loads the knees most). The owner: "natural sun is important, so we can encourage outdoor
  running on a good weather".
- **Exercise rules (D-056, D-061):** an exercise whose usual mistake injures is replaced, judged by injury risk, not
  complexity (the owner: "simple moves are not necessarily safe, complex ones not necessarily dangerous"); well-known
  names only (the owner: "use only well-known exercises with their own names, easy to judge"); everyday movements get
  no video; the handstand drills (freestanding included) and the split drills stay as they are, by his pickers.
- **Shape of the days (D-007–D-009):** a 15-min morning block plus a main session of about 45 min (50–55 on run and
  interval days); Saturday long outdoor + rows and farmer holds at home; Sunday light. **About 7½ h in a full week**, about 8 with the
  longest Saturday run; Week 0 about 6 h (half volume all seven days since D-067; 5½ before), the ramp-up weeks about 6½ (set under the owner's delegation: "you arrange
  the daily intensity" and "I have time"). It is 7½, not the 7 h of the first summary.
- **App (D-010–D-014, D-047):** the iPhone first and every platform since D-047; the address
  `https://tortoise.doctornova.net`, fixed forever; data on the phone with a Google Drive copy once signed in (D-054);
  the Drive sync the only backup since D-055; no reminders since D-053; a Shell day counts, and the streak breaks only
  on two missed days in a row.
- **Day status and streak (D-029, D-057):** either part alone makes a Shell day; one missed day is bridged without
  counting; there is no pause (the owner: "the app does not care whether you are sick, injured or busy; only whether
  today's exercise is done, how much, and how far from the goal"); on a test day the test part stands in for the main
  session.
- **Other rulings:** backups merge by `updatedAt`, logs have random ids (D-032); statuses differ by shape as well as
  colour, light-theme shell `#9A6212` and sky `#2A72AB` (D-033); 4-week blocks, the test in Week 0 and every 12 weeks
  (D-015); Week 0 at half volume, all levels 1, one start question since D-056 (D-030); plan repairs (D-031).
- **Stack (D-016):** TypeScript 7.0.2, React 19.3.1, Vite 8.3.8, Tailwind CSS 4.3.5, TanStack Router 1.170.46 (plugin
  1.169.0), zod 4.6.7, lucide-react 1.77.0, Biome 2.6.8, Vitest 5.1.1, Playwright 1.65.1, jsdom 31.0.1,
  fake-indexeddb 6.2.8, Node 24, pnpm 11.20.0. First-party service worker (D-017); hand-made SVG charts (D-019).
- **Building rulings:** D-036 (Phase 0), D-037 (Phases 2–3), D-038 (Phase 1 gaps), D-039 (CI/CD, owner), D-040
  (player), D-041 (test wizard, Progress), D-042 (settings, backup, reminders), D-043 (library, content), D-044
  (spoken coaching, photos; weather not built), D-045 (owner: no weather hint; video links as chosen), D-046 (CI gates
  side by side, actions on Node 24), D-047 (owner: every platform; the install card), D-048 (owner: the glass look),
  D-049 (CI renders the e2e at 1x); 2026-11-23: D-050 (owner: no pocket lock, screen on while open), D-051 (beginner
  handstand ladder, builder's ruling on the owner's ask), D-052 (owner: when in the day), D-053 (owner: no habits,
  daylight, runs, display, reminders, storage, raindrops; the habits advice and paluch2022/stamatakis2022 gone from the
  plan), D-054 (owner: Google Drive backup, the French client ID), D-055 (owner: the Drive sync is the only backup,
  the file backup and reminder gone, the card shows only the last sync; renewal by hidden frame or next tap, builder's
  rulingruling), D-063 (owner: the equipment in About: a yoga mat, a jump rope, one dumbbell pair), D-064 (owner: commit,
  push and compact after every job, this repo only), D-060 (owner: videos play in the app after a tap), D-061 (owner: 48 → 35), D-062 (owner: a shorter
  Progress), D-056 (owner: safer, fewer exercises, no bar, no library, videos, the indoor walk; the
  list is a builder's ruling under his delegation; vandyk2019 left the sources), D-057 (owner: the day page, no pause,
  no ring), D-058 (owner: badges; the style a builder's ruling), D-059 (builder: the still tab bar), D-065 (builder:
  version from git), D-066 (owner: a badge's card with ✕, no hover tooltips, one-line labels), D-067 (owner: no fitness
  test; ability badges by ladder level), D-068 (owner: docs, code and badges agree before every commit), D-069 (owner:
  levels move by check-ins after a session; five start questions).

## Where things are

- `src/data/` the plan as data (`plan.ts`, `schema.ts`, `sessions.ts`, `ladders.ts`, `exercises.ts`, `videos.ts`,
  `rules.ts`, `start-rules.ts` (the five start questions' bands), `milestones.ts` (41), `rationale.ts`, `equipment.ts`).
  `tests.ts` and `at99.ts` went with D-067.
- `src/lib/` `dates`, `calendar`, `status`, `progression`, `calc`, `milestones`, `pillars`, `records`,
  `db` (migrations 1–2), `repo`, `live`, `plan-view`, `use-app`, `player`, `sound`, `wake-lock`, `use-now`,
  `milestone-repo` (was `test-repo`), `start-levels`, `photos`, `badges`, `backup` (the format and the merge only),
  `install`, `effects`,
  `sync/` (google, drive, sync). Removed by D-053: `daylight`, `ics`, `rain`, `src/data/habits.ts`, `RemindersCard`;
  by D-055: `share`, `BackupCard`, `BackupReminder`, `formatBytes`; by D-056/D-057: `library`, the library routes,
  `DayRing`; by D-067: `test-results`, the Rockport, sit-to-rise and height calculators in `calc`.
- `src/routes/` `index.tsx` (Today), `week.tsx`, `day.$date.tsx`, `play.$date.$slot.tsx`,
  `progress.tsx`, `settings.tsx`, `debug.week.tsx`; `src/components/` `player/` (`Player.tsx` with `CheckInCard`),
  `progress/` (`BadgeMedal.tsx`, `BadgeDialog.tsx`), `settings/`, `Backdrop.tsx`, `FirstRun.tsx`, `InstallCard.tsx`, `ExerciseLink.tsx`, `TabBar.tsx`
  (four tabs; D-059: `.tab-bar` own layer, one font weight, no tap scale; `html` `scrollbar-gutter: stable`); `src/sw/sw.ts` (every navigation gets the app shell except `/oauth-silent.html`); `public/`
  (icons, manifest, `oauth-silent.html` + `.js`).
- `tests/` `unit`, `content`, `db` (`settings.test.ts`: two saves at once), `component`, `guard`, `fixtures`, `e2e`
  (`smoke`, `daily-loop`, `screens`, `player` (answers the check-ins), `progress` (start questions, badges, the card,
  one-line labels), `settings`, `photos`, `look`; `unit/badges.test.ts` checks every badge earned at its threshold and
  not a step before, and earnable at all (D-068); `unit/progression.test.ts` the check-in turns; `db/milestone-repo`
  the start levels and awards; screenshots land
  in `test-results/`).
- `scripts/` `make-icons.mjs`, `guard-hash.mjs`, `guard-key.mjs`, `vite-pwa-plugin.ts`.
- Commits of 2026-11-22: `35f88ff` CI/CD, `d8e112c` Phase 4, `97cd9a1` Phase 6, `c332503` Phase 7, `7f3b5be` Phase 5,
  `a9153fc` Phase 9 offline parts, `bd7a9b8` D-045; afternoon: `7f2ef15` the settings race, `e64c8ed` CI side by side
  (D-046), `856d3d7` the install card (D-047), `af76e29` the glass (D-048), `5a32c8d` CI e2e at 1x (D-049), `3fa4a81`
  the Phase 8 glass check; Phases 0–3 earlier (`79befb7` … `f63c61d`). 2026-11-23: `a512c90` D-050, `9e7400e`
  D-051/D-052, `bda0535` D-053, `4933a2a` the heavy tests' limits, `dcf1621` D-054, `687985c` D-055, `f9bdde3` D-056 to D-059, `ec23c75` D-060, `df84136` D-061/D-062, `4dad116` D-063/D-064, `6f049f2` D-065 (version from git), `447a5f6` D-066, `3c09296` D-067/D-068, `c8f6d07` D-069, then the source counts in `docs/sources.md` (Part A 21, Part B 17).

## Background

- The repo started on 2026-11-21 as an empty public repo; the plan and its review (D-029 to D-035) landed that day and
  night. Building began 2026-11-22 with Phases 0–3, then 4–9 the same day, then the install card, the glass and the CI
  work in parallel sessions that afternoon.
- Ideas and 19 sources came from the owner's Straight Back page (<https://money.doctornova.net/posture>).
- DNS: doctornova.net on GoDaddy nameservers; `money` and `tortoise` are CNAMEs to `mortal-dog.github.io`.
