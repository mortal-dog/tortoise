# Tortoise — now

<!-- Written only by the compact-ai skill. This repo is PUBLIC: project facts only, no personal facts (D-022), English
     only (the owner's words are quoted in English translation). -->

## Open work and next steps (as of 2026-11-22)

- **Nothing in flight.** The handoff sheet is empty. Phases 0 to 3 are built, committed and pushed to origin/main on
  the owner's picker yes (2026-11-22, CI run green at 08:38 ET):
  - `79befb7` Phase 0; `4355376` the plan schema; `491994c` Phase 2; `4ae93a6` Phase 1 data (a subagent in a git
    worktree, cherry-picked); `f63c61d` Phase 3 and the docs (D-036 to D-038).
  - The owner, 2026-11-22: "implement phase 0 to 3". That started the building and ended D-021's no-code rule.
- **Next: Phase 4, the session player** (`docs/3-implementation.md` §4), when the owner asks. Write its entry in
  `ai/resume.md` first (global §0). Phase 4 adds the **Start** buttons to the Today cards; it needs:
  - the step engine on `src/lib/calendar.ts` `adjustDose()` (Week 0 halves, ramp 2 sets, light week) and the interval
    stage of `plan.blockRules.intervalStages`;
  - a level offset for Friday's push-up, "one variant harder than Monday's", which is only a note in the data (D-038 4);
  - logs written by the player: "Done as planned" writes no logs (D-037 3), so the level-up banner on Today stays
    silent until the player logs sets.
- **Plan gaps the data encodes by its closest reading (D-038), worth the owner's look:** A0 jumps show the squat jump
  (ladder level 1), not the table's broad jump; the four exercises added without an Appendix A row (brisk walk, easy
  walk, marching in place, cool-down); Thursday plyometrics counted as about 3 min; no data home yet for the ramp-week
  effort notes, the rest between Day-2 tests, §9 stages to 99, §13 pain rules and §14 adaptations.
- **Later phases' tabs are minimal on purpose (D-037 6):** Progress shows the streak numbers, Library a plain list,
  Settings the start date, daylight location and run default.
- **Phase 8 domain steps wait for Phase 8 and run in this order** (D-035; GitHub's documentation, read in raw text):
  1. the owner verifies doctornova.net for GitHub Pages in the account settings (a TXT record), if not yet verified;
  2. the repo's Pages settings, on the owner's yes: source "GitHub Actions", custom domain `tortoise.doctornova.net`;
  3. the owner adds the GoDaddy DNS CNAME `tortoise` → `mortal-dog.github.io`;
  4. "Enforce HTTPS" once the certificate is issued.

  A DNS record that exists before a site has claimed the name lets someone else's site claim it. Then Phase 8 adds the
  push trigger to `.github/workflows/deploy.yml` (manual only now).

## Standing rules (also in CLAUDE.md)

- **Gates before every code commit:** `pnpm check && pnpm test && pnpm build && pnpm e2e`, chained with `&&` (CLAUDE.md
  rule 3; commands in CLAUDE.md). `pnpm e2e` builds and serves `dist/` itself on port 4173.
- **The personal-term guard needs the untracked `.guard-key`** at the repo root (D-034); CI has it as the secret
  `TORTOISE_GUARD_KEY` (set 2026-11-22). Details: `ai/memory/guard-tests.md`.
- **Public repo** (`mortal-dog/tortoise`, visibility PUBLIC): no personal facts in any committed file, including docs,
  code, tests, this file, `ai/memory/` and commit messages. Health answers given in pickers never go in. Profile values
  live only on the phone (D-022). Times in ai/ files are ET only.
- **Example data comes from neutral places.** Mocks, fixtures and tests take daylight values from Greenwich or from
  NOAA's own published examples, and invented values elsewhere; never real coordinates, dates or measurements. The
  tests run in `Europe/London` (set in `vitest.config.ts`; `timezoneId` in the e2e specs).
- **English only** in committed files.
- **Numbers need sources**, each read in its raw text (`docs/sources.md`).
  - A finding restates only what the text says, and says who was studied.
  - The plan's own choices are *our rule*: its doses, ladder steps, pass targets, milestones and test aims as a whole
    (`docs/2-exercise-plan.md`, "How to read the numbers"), and single lines marked one by one.
  - How to fetch each kind of raw text: `ai/memory/reading-sources-raw.md`.
- **Docs and data change together:** a plan change updates `docs/2-exercise-plan.md`, `src/data/` and (for a number)
  `docs/sources.md` in one commit. `tests/content/verbatim.test.ts` fails when copied text drifts from the plan.
- **Decisions** get a D-number in `docs/decisions.md`; **the next is D-039**.
  - The owner's decisions go through a picker.
  - Construction choices are builder's rulings, which the owner may overturn.
- **Pushes:**
  - compact-ai pushes `ai/` as its job;
  - any other push to this public repo goes through a picker (approved in pickers on 2026-11-21 and twice on
    2026-11-22);
  - from Phase 8 on, a push to main also deploys the site.
- **UI:**
  - no grey except for disabled controls (Tailwind's default palette is removed, so no grey class exists; the
    `disabled` token is the one grey; native controls with grey borders get drawn in theme colours, as the day
    page's checkboxes);
  - iPhone first; offline;
  - no third-party requests at runtime;
  - English UI.
- **The weekly hours are stated in four places** that must change together: `docs/2-exercise-plan.md` §4–§5,
  `docs/plan.md`, D-009 and this page. Recount them from the sessions' minutes after any session change.

## Pitfalls

- **Building pitfalls** (worktrees and Biome, Playwright clock and locators, TypeScript 7 and the service worker, the
  NOAA reference values): `ai/memory/building-pitfalls.md`.
- **Evidence that is easy to overstate:** `ai/memory/evidence-pitfalls.md`. The review of 2026-11-21 found eight
  findings that said more than their raw text; the same slips come back whenever a finding is written from memory.
- **The address is the data:** IndexedDB belongs to the exact origin, so moving the app strands the phone's data until
  an export and import (D-010).
- **The guard key has no backup** besides the CI secret, which cannot be read back. Losing `.guard-key` means a new key
  and the hash list made again from the banned terms.
- **iOS web-app limits** to verify on the phone (design §2):
  - Web Push needs a server;
  - there is no Vibration API;
  - Web Audio starts only after a tap, and the silent switch may mute it;
  - wake lock in home-screen mode was broken on older iOS;
  - timers stop in the background;
  - the home-screen app keeps its own data, apart from Safari's, so the first run asks to install before starting;
  - speech synthesis in the home-screen app;
  - which hand-off adds the calendar file from a home-screen app: the share sheet, or opening the file.
- **Custom domain:** with an Actions deployment, GitHub Pages takes it from the Pages settings, not from a `CNAME` file.
- **A level label can collide with a slot label.** The strength tables use A1, B2, C1 for exercise slots, so the back
  extension and core ladders number their levels 1, 2, 3 instead of B1 or C1. On cards, numeric codes read "L1" and
  lettered codes stand alone ("H1", "Ba1"): `src/lib/plan-view.ts` `stepName()`.

## Decisions to remember (details in docs/decisions.md)

- **Goals (D-002):** at 99, a straight back and still able to jump and run; on the way, a handstand, the side split and the
  front split. Exercise only (D-001).
- **Equipment (D-003–D-006):**
  - one fixed medium/heavy dumbbell pair (7–15 kg);
  - a jump rope;
  - playground bars on outdoor days; the owner declined the recommended pull-up bar.
- **Outdoors (D-004):** outdoor running in good weather, the rope indoors. The owner: "natural sun is important, so we
  can encourage outdoor running on a good weather".
- **Shape of the days (D-007–D-009):**
  - a 15-min morning block plus a main session of about 45 min (50–55 on run and interval days);
  - Saturday long outdoor + playground; Sunday light: an easy walk, then the flexibility session;
  - **about 7½ h in a full week**, about 8 with the longest Saturday run; Week 0 about 5½ h, the ramp-up weeks about
    6½. It is 7½, not the 7 h (and 4–5 h for the ramp) of the first summary, which the sessions' own minutes did not
    add up to;
  - that load was set under the owner's delegation: "you arrange the daily intensity" and "I have time".
- **App (D-010–D-014):**
  - iPhone; the address `https://tortoise.doctornova.net`, fixed forever, because the phone keeps data per origin;
  - data only on the phone; reminders by calendar file;
  - a Shell day counts, and the streak breaks only on two missed days in a row.
- **Day status and streak, completed (D-029):**
  - either part alone, the morning block or the main session, makes a Shell day;
  - a day with something done is never Paused;
  - the streak number counts done days; one missed day is bridged without counting; paused days are skipped;
  - on a test day the test part stands in for the main session.
- **More app rulings from the review:**
  - backups merge by `updatedAt`, and logs have random ids, not auto-increment ids (D-032);
  - statuses differ by shape as well as colour; the light theme's shell is `#9A6212` and sky `#2A72AB`, so that every
    text colour reaches 4.5:1 (D-033).
- **Cycle (D-015):** 4-week blocks (3 build + 1 light). The Tortoise Test comes in Week 0, then every 12 weeks in the
  light week.
- **Week 0 and test weekends (D-030):**
  - Week 0 runs at half volume with every ladder at level 1;
  - on a test weekend the two test days replace Saturday's and Sunday's main sessions and split blocks;
  - three start questions (easy running, the rope, a slow negative pull-up) set the levels the tests cannot.
- **Plan repairs (D-031):**
  - the 10% rule applies beyond the run–walk and rope ladders; rope step J6 grows by 10% a week;
  - indoor fallbacks: Tuesday follows the rope ladder; Saturday is Tuesday's indoor session plus the home pulling work;
  - the core ladder ends at the L-sit; hanging raises stay at the playground;
  - the split blocks have a short form and a long form;
  - the farmer hold is on test Day 2; the 100-day milestone is "Adult", not "Shell";
  - the exercise library has an entry for every exercise the sessions and ladders name (74 rows; the data has 78).
- **Stack (D-016), pinned in Phase 0:** TypeScript 7.0.2, React 19.3.1, Vite 8.3.8, Tailwind CSS 4.3.5, TanStack
  Router 1.170.46 (plugin 1.169.0), zod 4.6.7, lucide-react 1.77.0, Biome 2.6.8, Vitest 5.1.1, Playwright 1.65.1,
  jsdom 31.0.1, fake-indexeddb 6.2.8, Node 24, pnpm 11.20.0. A first-party service worker (D-017); hand-made SVG charts
  (D-019).
- **Building rulings:**
  - D-036 (Phase 0): no default palette; the service worker as a second Vite entry with its precache list written by
    `scripts/vite-pwa-plugin.ts`; `404.html` copied from `index.html`; `robots.txt` disallows all; WebKit serves the
    app offline, so the offline test runs on WebKit.
  - D-037 (Phases 2–3): dates as whole day numbers; daylight checked against NOAA's spreadsheet values; "Done as
    planned" writes no logs; a test day's "Done as planned" records the test part until the wizard; the day page
    `/day/<date>`; the minimal tabs.
  - D-038 (Phase 1): the plan gaps above.

## Where things are

- `src/data/` the plan as data (`plan.ts` exports `plan`, `planInput` and the `exerciseById`, `ladderById`,
  `sessionById` maps; `schema.ts` the zod schemas; `rationale.ts` the plan's prose findings).
- `src/lib/` the rules: `dates`, `calendar`, `status` (streak), `progression`, `calc`, `daylight`, `milestones`,
  `pillars`, `records` (record schemas), `db` (IndexedDB, migrations), `repo` (reads and writes), `live` (change
  bus), `plan-view` (display lookups), `use-app` (screen state).
- `src/routes/` Today (`index.tsx`), `week.tsx`, `day.$date.tsx`, `progress.tsx`, `library.tsx`, `settings.tsx`,
  `debug.week.tsx`; `src/sw/sw.ts` the service worker.
- `tests/` `unit`, `content`, `db`, `component`, `guard`, `fixtures` (block rules as design §5.1, ladders), `e2e`
  (`smoke`, `daily-loop`, `screens`: screenshots land in `test-results/`).
- `scripts/` `make-icons.mjs` (`pnpm icons`), `guard-hash.mjs` and `guard-key.mjs`, `vite-pwa-plugin.ts`.

## Background

- The repo started on 2026-11-21 as an empty public repo; the plan landed the same evening.
- The owner asked for a review of all documents that night ("review all docs and fix all issues"). Every source was
  read again in its raw text, and the review closed with D-029 to D-035.
- Ideas, and 19 sources already checked in their raw text, came from the owner's Straight Back page
  (<https://money.doctornova.net/posture>).
- DNS: doctornova.net uses GoDaddy nameservers (domaincontrol.com); `money.doctornova.net` is a CNAME to
  `mortal-dog.github.io`.
