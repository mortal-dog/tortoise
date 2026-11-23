# Tortoise — now

<!-- Written only by the compact-ai skill. This repo is PUBLIC: project facts only, no personal facts (D-022), English
     only (the owner's words are quoted in English translation). -->

## Open work and next steps (as of 2026-11-23, 11:46 ET)

- **Nothing in flight; the handoff sheet is empty.** The owner's asks of 2026-11-23 are built, pushed and live: a
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
  **Glass** (smooth scrolling and player with the drifting backdrop, no warm phone, Reduce Transparency gives solid
  panels; D-049). Then **other platforms** (D-047): Android Chrome, desktop Chrome or Edge. **When the owner reports
  results, write them into `docs/3-implementation.md` under Phase 8** (its done criterion) and fix what fails. The
  calendar-file, location and storage rows went with D-053, the backup-file row with D-055.
- **Owner questions left open (optional, no picker asked yet):** the 44 "why" lines and the four walking rows of
  Appendix A (D-043); the two new handstand drills (plank on the hands, pike hold) have no teaching link yet
  (`noLinkFound` in `src/data/videos.ts`).
- **A known limit of the sync, not asked about:** a plain sync only uploads this device's file; another device's
  changes come in only when this device signs in (first sign-in restore). Told the owner 2026-11-23.
- **Plan gaps still encoded by their closest reading (D-038):** A0 jumps show the squat jump (ladder level 1), not the
  table's broad jump; Thursday plyometrics counted as about 3 min; no data home yet for the ramp-week effort notes, the
  rest between Day-2 tests, §9 stages to 99, §13 pain rules and §14 adaptations.
- **The domain steps are done** (D-035): Pages with source "GitHub Actions", custom domain `tortoise.doctornova.net`,
  GoDaddy CNAME `tortoise` → `mortal-dog.github.io`, TXT `_github-pages-challenge-mortal-dog` (must stay), HTTPS
  enforced.

## Standing rules (also in CLAUDE.md)

- **Gates before every code commit:** `pnpm check && pnpm test && pnpm build && pnpm e2e`, chained with `&&` (CLAUDE.md
  rule 3). `pnpm e2e` builds and serves `dist/` itself, on port 4173 or `TORTOISE_E2E_PORT` (one port per worktree;
  a running server is never reused), at the iPhone profile's 3x unless `TORTOISE_E2E_DPR` says otherwise (CI sets 1).
  Last green: 287 Vitest tests in 32 files and 20 e2e tests on `687985c`; CI green on `687985c` (run 45214620004).
  The two heavy tests (`tests/db/db.test.ts` 60 years of days, `tests/guard/personal-terms.test.ts`) carry their own
  30-s limit since `4933a2a`: under vitest's 5-s default they failed twice while another repo's tests loaded the Mac.
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
- **Decisions** get a D-number in `docs/decisions.md`; **the next is D-056**. Entries sit in the section of their topic
  (CI rulings under "Building and the repo"). The docs guard requires the numbers with no gap, so parallel sessions'
  entries are renumbered after main's at merge (done for D-042 and D-043; D-047 and D-048 were reserved up front).
- **Settings saves:** `saveSettings` reads and writes the record in one transaction; a nested field (profile, units)
  is saved as a function of the stored record, `saveSettings((s) => ({ units: { ...s.units,
  mass: v } }))`, never spread from the rendered copy (`7f2ef15`: two times typed in a row lost the first).
- **The sync card shows only the last sync's date and time** (D-055; the owner: "remove all other wordings. you can just
  show last sync date time. and remove wordings like 'restore merges: for each record the newer copy wins, blabla.'"):
  no explanations on it; an error line only when there is one; buttons Sign in with Google, or Sync now and Sign out.
  Keep new Drive features off that card unless he asks.
- **UI:** no grey except disabled controls (no grey class exists; the `disabled` token); iPhone first, every platform
  (D-047); offline; **no third-party requests at runtime except Google's sign-in and Drive, only after the user signs
  in** (CLAUDE.md rule 7 since D-054; D-045's "no weather hint" stands); English UI.
- **When in the day (D-052, owner's pickers):** the morning block after waking; the main session at lunch to
  mid-afternoon, 3–4 h after it; the split block straight after the main session in the same sitting (a drink and 2
  min of walking). The texts live in `src/data/week.ts` `dayTimes` (the "When" column of plan §4) and show on the Today
  cards.
- **Handstand skill ladder (D-051):** 14 levels, H1–H6 on the floor or low on the wall (plank on the hands, pike hold,
  pike hold feet on a chair, wall plank at knee, thigh, then hip height = the old L); the morning slot is the level's
  holds with 30-s rests, 3–6 min, not a 6-minute timer; the morning block asks feedback after its ladder steps
  (`player.ts` `askFeedback`). The owner: a beginner; "the difficulty must grow slowly, not start at an expert level".
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
  `launch_handler` `focus-existing`.
- **The look** (D-048, D-053): glass panels (`glass`, `glass-strong` utilities in `src/styles.css`) over a backdrop of
  four soft glows drifting over 80–131 s (`src/components/Backdrop.tsx`); a floating glass tab bar with a gliding pill.
  No raindrops and no Display switch since D-053: the backdrop always drifts (`src/lib/effects.ts` reads only reduced
  motion), reduced transparency gives solid panels; the contrast guard checks every text colour over every glow overlap.
- **Screen awake (D-050):** the root layout (`src/routes/__root.tsx`) holds the wake lock whenever the app is open and
  shares its state through `WakeLockContext` (`src/lib/wake-lock.ts`); the player shows the Auto-Lock notice when it is
  missing or refused. No pocket lock. The owner: the lock and "Hold to unlock" felt pointless; "once the app is open the
  screen stays on, the OS cannot lock it".
- **Today:** cards with **Start** (the player) and "Done as planned", each with its time of day (D-052); on test days
  **Start** opens the test wizard; banners; the day ring. No habits card, no daylight strip (D-053), no backup reminder
  (D-055). Run days start at Outdoor.
- **Player** (`/play/<date>/<morning|main|split>`, D-040): units from `src/lib/player.ts` `buildUnits()` (pairs
  alternate and rest after each pair; level holds vs reps by the pass target; run–walk and rope levels as intervals;
  the interval stage by block; Week 0, ramp and light changes; Friday's push-up `levelOffset: 1`); timers from
  timestamps (`position()`); tones unlocked on Start (`src/lib/sound.ts`), spoken cues and spoken coaching (switch kept
  in localStorage); feedback (in the morning block only after its ladder steps); the summary saves logs and
  the card in one transaction (`repo.ts` `savePlayedSession`).
- **Library** (D-043): `library.index.tsx` (search, area and video filters kept in the address),
  `library.$exerciseId.tsx` (how, cue, mistake, why with source chips, ladder with "Set" by hand, last 10 logs, video
  link with its check date), `library.sources.$sourceId.tsx`. Every exercise has a `why` (the schema requires it); 48
  of 80 have a video link (`src/data/videos.ts`, oEmbed titles, checked 2026-11-22; the order kept by the owner,
  D-045).
- **Tortoise Test** (`/test/<Day 1 date>?day=1|2`, D-041): cards save on their own; "Finish" first saves every card
  with unsaved changes (a race the e2e test caught under load), marks the day done, sets Week 0's starting levels
  (`test-results.ts` `startingLevels()`), awards milestones. Stopwatches, the 15-s pulse count, sit-to-rise steppers,
  Rockport with the 30–69 age flag, yearly height (48 weeks), the three start questions.
- **Progress** (D-041): numbers and minutes per pillar this week; the Shell (two weeks a row); milestones (next up,
  earned; checked on open); photos (D-044: `photos` store, migration 2, JPEG ≤ 1280 px as data URLs, in the Drive copy); At
  99; test trends with aim lines (`aimLine` in `src/data/tests.ts`); level step charts; empty charts listed in one line.
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
- **Equipment (D-003–D-006):** one fixed medium/heavy dumbbell pair (7–15 kg); a jump rope; playground bars on outdoor
  days; the owner declined the recommended pull-up bar.
- **Outdoors (D-004):** outdoor running in good weather, the rope indoors. The owner: "natural sun is important, so we
  can encourage outdoor running on a good weather".
- **Shape of the days (D-007–D-009):** a 15-min morning block plus a main session of about 45 min (50–55 on run and
  interval days); Saturday long outdoor + playground; Sunday light. **About 7½ h in a full week**, about 8 with the
  longest Saturday run; Week 0 about 5½ h, the ramp-up weeks about 6½ (set under the owner's delegation: "you arrange
  the daily intensity" and "I have time"). It is 7½, not the 7 h of the first summary.
- **App (D-010–D-014, D-047):** the iPhone first and every platform since D-047; the address
  `https://tortoise.doctornova.net`, fixed forever; data on the phone with a Google Drive copy once signed in (D-054);
  the Drive sync the only backup since D-055; no reminders since D-053; a Shell day counts, and the streak breaks only
  on two missed days in a row.
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
  D-049 (CI renders the e2e at 1x); 2026-11-23: D-050 (owner: no pocket lock, screen on while open), D-051 (beginner
  handstand ladder, builder's ruling on the owner's ask), D-052 (owner: when in the day), D-053 (owner: no habits,
  daylight, runs, display, reminders, storage, raindrops; the habits advice and paluch2022/stamatakis2022 gone from the
  plan), D-054 (owner: Google Drive backup, the French client ID), D-055 (owner: the Drive sync is the only backup,
  the file backup and reminder gone, the card shows only the last sync; renewal by hidden frame or next tap, builder's
  ruling).

## Where things are

- `src/data/` the plan as data (`plan.ts`, `schema.ts`, `sessions.ts`, `ladders.ts`, `exercises.ts`, `videos.ts`,
  `tests.ts` with `aimLine`, `rules.ts`, `start-rules.ts`, `milestones.ts`, `at99.ts`, `rationale.ts`).
- `src/lib/` `dates`, `calendar`, `status`, `progression`, `calc`, `milestones`, `pillars`, `records`,
  `db` (migrations 1–2), `repo`, `live`, `plan-view`, `use-app`, `player`, `sound`, `wake-lock`, `use-now`,
  `test-results`, `test-repo`, `photos`, `library`, `backup` (the format and the merge only), `install`, `effects`,
  `sync/` (google, drive, sync). Removed by D-053: `daylight`, `ics`, `rain`, `src/data/habits.ts`, `RemindersCard`;
  by D-055: `share`, `BackupCard`, `BackupReminder`, `formatBytes`.
- `src/routes/` `index.tsx` (Today), `week.tsx`, `day.$date.tsx`, `play.$date.$slot.tsx`, `test.$date.tsx`,
  `progress.tsx`, `library.index.tsx`, `library.$exerciseId.tsx`, `library.sources.$sourceId.tsx`, `settings.tsx`,
  `debug.week.tsx`; `src/components/` `player/`, `test/`, `progress/`, `settings/`, `Backdrop.tsx`, `FirstRun.tsx`,
  `InstallCard.tsx`; `src/sw/sw.ts` (every navigation gets the app shell except `/oauth-silent.html`); `public/`
  (icons, manifest, `oauth-silent.html` + `.js`).
- `tests/` `unit`, `content`, `db` (`settings.test.ts`: two saves at once), `component`, `guard`, `fixtures`, `e2e`
  (`smoke`, `daily-loop`, `screens`, `player`, `test-wizard`, `settings`, `library`, `photos`, `look`; screenshots land
  in `test-results/`).
- `scripts/` `make-icons.mjs`, `guard-hash.mjs`, `guard-key.mjs`, `vite-pwa-plugin.ts`.
- Commits of 2026-11-22: `35f88ff` CI/CD, `d8e112c` Phase 4, `97cd9a1` Phase 6, `c332503` Phase 7, `7f3b5be` Phase 5,
  `a9153fc` Phase 9 offline parts, `bd7a9b8` D-045; afternoon: `7f2ef15` the settings race, `e64c8ed` CI side by side
  (D-046), `856d3d7` the install card (D-047), `af76e29` the glass (D-048), `5a32c8d` CI e2e at 1x (D-049), `3fa4a81`
  the Phase 8 glass check; Phases 0–3 earlier (`79befb7` … `f63c61d`). 2026-11-23: `a512c90` D-050, `9e7400e`
  D-051/D-052, `bda0535` D-053, `4933a2a` the heavy tests' limits, `dcf1621` D-054, `687985c` D-055.

## Background

- The repo started on 2026-11-21 as an empty public repo; the plan and its review (D-029 to D-035) landed that day and
  night. Building began 2026-11-22 with Phases 0–3, then 4–9 the same day, then the install card, the glass and the CI
  work in parallel sessions that afternoon.
- Ideas and 19 sources came from the owner's Straight Back page (<https://money.doctornova.net/posture>).
- DNS: doctornova.net on GoDaddy nameservers; `money` and `tortoise` are CNAMEs to `mortal-dog.github.io`.
