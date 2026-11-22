<!-- Finished handoff entries of this repo, newest first (protocol: ~/Repo/script/claude/resume.md).
     This repo is PUBLIC: no personal health or household facts in this file. -->

## Compact the closed sessions of 2026-11-22 — started 2026-11-22 16:24 ET, done 2026-11-22 16:30 ET

**Why:** the owner, 2026-11-22: "all other sessions are closed you can handle compact everything for other sessions".

**Where:** ib (`~/Repo/ib`), this repo, the global memory (`~/Repo/script`, `ai/global-memory/`). Not the doctornova
session (live since 17:19 local), not the folder outside any repo (no context there by the owner's rule).

**Done**
- [x] survey: french's two sessions ran compact-ai (`f793712` and a later one); tortoise's Phases 0-9 session ran it
  (`1825aba`); not compacted: ib `a0c1875d` (the money-flow layer on its /economy page, pushed 16:22 ET on the owner's picker),
  tortoise `eaef234b` (glass, D-048) and `a1d2a868` (install card, D-047)
- [x] ib: compacted and pushed `814f17b` (now.md header, open work, Built on 11-22, Analysis answers given on 11-22,
  recent commits; memory `money-flow-layer-d243`; resume-done: the push done) — **do not commit it again**
- [x] global memory: the two leftover notes were committed by their own session (`ff84d1f`, 16:44 local); added
  `sheet-empty-sentinel-stays`, corrected `playwright-ci-renders-without-gpu` (WebKit draws no blur) — `ae749b1`, pushed
- [x] french: clean, pushed, sheet empty (`2e3c9c9` its last compact)
- [x] tortoise memory: `ci-pipeline` (no blur in WebKit), `building-pitfalls` (glass screenshots, contrast margin, the
  sheet's sentinel), the index — committed with this entry's move

- [x] ♻️ `ai/now.md`'s pitfall pointer names the new topics; this entry moved here; `ai/` committed and pushed

**Don't forget:** sessions that close without compact-ai leave their lessons only in their transcripts (the newest 3 per
project survive): read their final reports. The project kept out of sweeps stays out of them, its leftovers too.

## CI: the glass theme made the e2e tests 2-3x slower and the player test flaky — started 2026-11-22 15:13 ET, done 2026-11-22 15:30 ET

**Why:** the owner, 2026-11-22: "fix all issues and run compact at end", after the report that since `af76e29` (D-048)
the e2e shards take 36-50 s on CI instead of 12-22 s, and the player test hit its 30-s limit twice.

**Where:** the main tree. Probes go to a branch `ci-probe` and run with
`gh workflow run ci.yml --repo mortal-dog/tortoise --ref ci-probe -f deploy=false` (a branch run never deploys; the
workflow's concurrency group queues runs one at a time). Delete `ci-probe` at the end.

**Done**
- [x] bisect on CI: `856d3d7` fast (17/19/13 s), `af76e29` slow; no single change fixed it: no blur (36/46/30 s), the
  Moving background switch off (33/41/74 s, flaky), reduced motion (42/50/40 s)
- [x] probes: 1x on CI 18/32/21 s, no timeout; 1x and a still backdrop 18/27/18 s (within the spread, not taken)
- [x] `5a32c8d` CI: render the e2e tests at 1x (D-049); gates green (311 Vitest in 33 files, 22 e2e); `ci-probe`
  deleted
- [x] `3fa4a81` Phase 8 checklist row for the glass; pushed to main on the owner's picker (push, then check); CI on
  main with deploy off green (run 45066211124: e2e 20/28/22 s, no retry)
- [x] ♻️ compact-ai ran: `ai/now.md` rewritten, `ai/memory/ci-pipeline.md` new, `building-pitfalls.md` and the index
  updated, this entry moved here

**Don't forget:** the next D-number is D-050; CI renders the e2e at 1x (`TORTOISE_E2E_DPR=1`); test a workflow change
on a branch with `-f deploy=false` (`ai/memory/ci-pipeline.md`).

## A smarter first run: detect the platform, install button, open the installed app — started 2026-11-22 13:15 ET, done 2026-11-22 14:48 ET

**Why:** owner 2026-11-22: "detect if already installed then open the app directly from browser; if not installed show
an install button; continue in browser stays; where a platform has no install button, show directions" and "we also
support desktop, Android, all platforms".

**Where:** done in a worktree (removed); the commit is on main. This job's decision is **D-047**.

**Done**
- [x] ♻️ research: install prompt (Chromium only), getInstalledRelatedApps for an in-scope PWA (Android Chrome 84+,
  desktop Chrome/Edge 140+, needs `related_applications` with `id` on desktop), navigation capturing opens the installed
  app from a link with `target=_blank` (desktop Chrome 139+); none of it in WebKit, so Apple platforms get directions
- [x] ♻️ `src/lib/install.ts`, `src/components/InstallCard.tsx`, `FirstRun.tsx`, manifest, tests, docs, D-047
- [x] ♻️ gates green on the committed tree: 286 Vitest tests in 31 files, 19 e2e
- [x] ⚠️ committed `856d3d7` and fast-forwarded main to it — **do not commit again**
- [x] ⛔ pushed to origin/main on the owner's picker, with the glass theme (`1825aba..af76e29`)

## A glass theme with subtle rain — started 2026-11-22 13:18 ET, done 2026-11-22 14:48 ET

**Why:** owner 2026-11-22: "a fancy semi-transparent theme all over the app, like glass, and raindrops moving slowly,
almost unnoticeably, on some screens; in a nutshell, a fancy modern theme with subtle dynamic effects".

**Where:** done in a worktree (removed); the commit is on main. This job's decision is **D-048**.

**Done**
- [x] ♻️ tokens and glass utilities in `src/styles.css`; `src/lib/rain.ts`, `src/lib/effects.ts`,
  `src/components/Backdrop.tsx`; glass on every surface; floating tab bar with a gliding pill; Settings → Display
  switch; photo viewer in a portal
- [x] ♻️ contrast guard over every glow overlap; `tests/unit/rain.test.ts`, `tests/component/backdrop.test.tsx`,
  `tests/e2e/look.spec.ts`; design §3, §3.7, §12, §13; D-048; screenshots checked (WebKit and Chrome)
- [x] ♻️ gates green: 311 Vitest tests in 33 files, 22 e2e
- [x] ⚠️ committed `af76e29` and fast-forwarded main to it — **do not commit again**
- [x] ⛔ pushed to origin/main on the owner's picker (`1825aba..af76e29`, with D-046 and D-047's commits); the
  scheduled run at 23:07 UTC deploys it

## Phases 4 to 9 and scheduled CI/CD — started 2026-11-22 08:54 ET, done 2026-11-22

**Why:** owner 2026-11-22: "do all the remaining phases" (in Chinese), and CI/CD "twice a day like the other repos,
plus manual, so pushes never trigger a run".

**Done**
- [x] CI/CD on a schedule (13:07 and 23:07 UTC) and by hand, one workflow `ci.yml` — `35f88ff` (D-039)
- [x] Phase 4, the session player — `d8e112c` (D-040)
- [x] Phase 6, the Tortoise Test wizard, Progress and milestones — `97cd9a1` (D-041)
- [x] Phase 7, settings, backup and reminders (worktree agent, merged) — `c332503` (D-042)
- [x] Phase 5, library and content (worktree agent, merged) — `7f3b5be` (D-043)
- [x] Phase 9 offline parts: spoken coaching, progress photos — `a9153fc` (D-044)
- [x] Owner pickers: push yes; Pages yes; no weather hint; video links kept — `bd7a9b8` (D-045); pushed to origin/main
- [x] GitHub Pages enabled: source GitHub Actions, custom domain `tortoise.doctornova.net` (domain state "unverified")

**Left, the owner's steps (Phase 8):**
- verify doctornova.net for GitHub Pages in the account settings (a TXT record), as protection;
- add the GoDaddy CNAME `tortoise` → `mortal-dog.github.io`;
- the first deploy comes with the scheduled run at 23:07 UTC; a manual `gh workflow run ci.yml` was refused by the
  auto-mode classifier, so the owner runs it if wanted;
- once the certificate is issued, tick "Enforce HTTPS" (builder, on request);
- the real-phone checklist in `docs/3-implementation.md` Phase 8.

## Phases 0 to 3 — started 2026-11-22 07:24 ET, done 2026-11-22

**Why:** owner 2026-11-22: "implement phase 0 to 3".

**Done**
- [x] Phase 0: scaffold and guardrails — `79befb7`
- [x] Phase 1: the plan content schema `4355376`; the data, content tests and debug week `4ae93a6` (a subagent in a
  worktree, cherry-picked)
- [x] Phase 2: storage and core logic — `491994c`
- [x] Phase 3: Today and Week, the e2e daily loop, screenshots reviewed in both themes; docs D-037 and D-038 — `f63c61d`
- [x] all four gates green on the final tree
- [x] ⛔ pushed `f63c61d` to origin/main on the owner's picker yes (2026-11-22); CI green at 08:38 ET — **do not push
  again**
- [x] ⛔ CI secret TORTOISE_GUARD_KEY set from `.guard-key` on the owner's picker yes

**Don't forget:** the next D-number is D-039; Phase 4 (the session player) is next, when the owner asks.

## Review all docs and fix every issue found — started 2026-11-21 21:30 ET, done 22:11 ET

**Why:** owner 2026-11-21: "review all docs and fix all issues."

**Done**
- [x] ♻️ read every doc in full: README.md, CLAUDE.md, docs/*.md, ai/*.md, ai/memory/*.md
- [x] ♻️ mechanical checks from the session scratchpad: sources defined and cited, links and anchors, D-numbers, table
  shapes, CJK, personal terms, theme contrast, mock widths
- [x] ♻️ every source re-read in raw text: 41 PubMed abstracts (efetch), 4 PMC full texts (ros2022, oc2023, sheaf2017,
  katzman2010), the oc2023 Appendix 1 (Europe PMC supplementary files), the octftf page; also GitHub's Pages
  custom-domain docs (raw markdown) and the npm versions of the stack
- [x] ⚠️ docs/sources.md: how each source was read; findings tightened (helgerud2007, pedisic2020, nielsen2014,
  afonso2021, ros2022, oc2023, liftmor2018/2019, harding2020, lanyon1984, ma2013, howe2011, kado2004, sheaf2017,
  green2004); katzman2010 links to its full text
- [x] ⚠️ docs/2-exercise-plan.md: evidence wording; doses declared our rule; hours recounted (about 7½ h a week);
  the 10% rule's scope; fallbacks; ladders; Week 0, start rules and test weekends; milestone Adult; library entries
- [x] ⚠️ docs/1-app-design.md: Today mock; day status and streak; first run; data model; reminders; theme tokens
- [x] ⚠️ docs/3-implementation.md: Phase 8 order (verify, claim in Pages, then DNS); guard tests; risks
- [x] ⚠️ docs/decisions.md: D-029 to D-035; D-009 and D-015 corrected; the next number is D-036
- [x] ⚠️ committed `fbf692e` (docs: review of all documents) — **do not commit it again**
- [x] ⚠️ committed `3c0edbe` (the sheet closed)
- [x] ⛔ pushed `fbf692e` and `3c0edbe` to origin/main on the owner's picker yes (2026-11-22 07:02 ET) — **do not push
  again**
- [x] ♻️ compact-ai ran on 2026-11-22, also on the owner's picker yes: ai/now.md and the memory match the reviewed docs

**Don't forget:** the next D-number is D-036; a full week is about 7½ hours; Phase 8 runs verify, claim in Pages,
then DNS (D-035); the guard list is kept as keyed hashes (D-034).

## Write the general plan docs (app design, exercise plan, implementation phases) — started 2026-11-21 20:40 ET, done 21:18 ET

**Why:** owner 2026-11-21: "first we need a general plan md file ... 1 app design md file 2. daily excercise plan monday
tuesday etc ... 3. implementation part detailed phases etc." Mid-turn: "natural sun is important, so we can encourage
outdoor running on a good weather"; the handstand and both splits added as goals; "you arrange the daily intensity";
then "don't write any code; write all the plan documents first; prepare everything except code".

**Done**
- [x] ♻️ read the Straight Back page's plan data for ideas and its checked sources
- [x] ♻️ owner's picker answers: playground bars (no purchase); one medium/heavy fixed dumbbell pair; a short morning block
  plus a main session later; iPhone; address tortoise.doctornova.net; Saturday long outdoor, Sunday light
- [x] ♻️ read 26 PubMed abstracts in raw text (E-utilities efetch); reused 19 sources from the Straight Back page
- [x] ♻️ wrote docs/plan.md, docs/1-app-design.md, docs/2-exercise-plan.md, docs/3-implementation.md, docs/decisions.md
  (D-001–D-028), docs/sources.md, CLAUDE.md, README.md
- [x] ♻️ checks: every cited source defined and every source cited; links and anchors resolve; D-numbers defined; no
  personal terms; no CJK
- [x] ⚠️ first commit of the repo, `14a550c` — **do not commit it again**
- [x] ⚠️ committed `c520ef6` (Phase 8 DNS steps wait until the repo claims the domain)
- [x] ⛔ pushed `14a550c` and `c520ef6` to origin/main on the owner's picker yes (2026-11-21) — **do not push again**

**Don't forget:** the repo is public: no personal facts in any committed file (D-022). No code until the owner starts
Phase 0 (D-021).
