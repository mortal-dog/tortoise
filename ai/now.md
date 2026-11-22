# Tortoise — now

<!-- Written only by the compact-ai skill. This repo is PUBLIC: project facts only, no personal facts (D-022), English
     only (the owner's words are quoted in English translation). -->

## Open work and next steps (as of 2026-11-22)

- **Nothing in flight.** The handoff sheet is empty. Everything is committed and pushed to origin/main:
  - `14a550c` the plan; `c520ef6` the Phase 8 DNS warning;
  - `fbf692e` the review of all documents (D-029 to D-035); `3c0edbe` the sheet closed.
- **Next: Phase 0, scaffold and guardrails** (`docs/3-implementation.md` §4), **only when the owner starts it.** No code
  before that. The owner, 2026-11-21: "don't write any code; write all the plan documents first; prepare everything except
  code" (D-021).
  - Before starting, write the Phase 0 entry in `ai/resume.md` (global §0).
  - **Versions:** the plan's numbers are those of the owner's existing frontend on 2026-11-21. Phase 0 pins what is
    current when it starts and writes that into D-016; npm already had Vitest 5 and TypeScript 7 on that day.
  - **Guard tests** (`docs/3-implementation.md` §3, `ai/memory/doc-checks-for-phase-0.md`): personal terms, CJK, grey
    classes, and the doc checks (sources defined and cited, links and anchors, D-numbers).
  - **The banned-term list is committed only as keyed hashes** (HMAC-SHA-256); the key stays in an untracked local
    file and a CI secret (D-034). A plain-text list would publish the terms, and a plain hash of a city or a first
    name falls to a dictionary attack. It is keyed hashes, not the plain hashes first planned.
  - The Content Security Policy meta tag goes into the production build only (the dev server needs inline scripts).
  - The deploy workflow is written with a manual trigger only; Phase 8 adds the trigger on a push to `main`.
  - Check whether Playwright's WebKit serves the app from its service worker with the network off. If not, that one
    test runs in Chromium, and the phone check of Phase 8 covers Safari.
- **Phase 8 domain steps wait for Phase 8 and run in this order** (D-035; GitHub's documentation, read in raw text):
  1. the owner verifies doctornova.net for GitHub Pages in the account settings (a TXT record), if not yet verified;
  2. the repo's Pages settings, on the owner's yes: source "GitHub Actions", custom domain `tortoise.doctornova.net`;
  3. the owner adds the GoDaddy DNS CNAME `tortoise` → `mortal-dog.github.io`;
  4. "Enforce HTTPS" once the certificate is issued.

  A DNS record that exists before a site has claimed the name lets someone else's site claim it. It is this order, not
  the "DNS first" of the first plan.

## Standing rules (also in CLAUDE.md)

- **Public repo** (`mortal-dog/tortoise`, visibility PUBLIC): no personal facts in any committed file, including docs,
  code, tests, this file, `ai/memory/` and commit messages. Health answers given in pickers never go in. Profile values
  live only on the phone (D-022). Times in ai/ files are ET only.
- **Example data comes from neutral places.** Mocks, fixtures and tests take daylight values from Greenwich or from
  NOAA's own published examples, and invented values elsewhere; never real coordinates, dates or measurements.
- **English only** in committed files.
- **Numbers need sources**, each read in its raw text (`docs/sources.md`).
  - A finding restates only what the text says, and says who was studied.
  - The plan's own choices are *our rule*: its doses, ladder steps, pass targets, milestones and test aims as a whole
    (`docs/2-exercise-plan.md`, "How to read the numbers"), and single lines marked one by one.
  - How to fetch each kind of raw text: `ai/memory/reading-sources-raw.md`.
- **Decisions** get a D-number in `docs/decisions.md`; **the next is D-036**.
  - The owner's decisions go through a picker.
  - Construction choices are builder's rulings, which the owner may overturn.
- **Pushes:**
  - compact-ai pushes `ai/` as its job;
  - any other push to this public repo goes through a picker (approved in pickers on 2026-11-21 and 2026-11-22);
  - from Phase 8 on, a push to main also deploys the site.
- **UI:**
  - no grey except for disabled controls;
  - iPhone first; offline;
  - no third-party requests at runtime;
  - English UI.
- **From Phase 1:** a plan change updates `docs/2-exercise-plan.md`, the plan data and (for a number) `docs/sources.md`
  in one commit.
- **The weekly hours are stated in four places** that must change together: `docs/2-exercise-plan.md` §4–§5,
  `docs/plan.md`, D-009 and this page. Recount them from the sessions' minutes after any session change.

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
  - the exercise library has an entry for every exercise the sessions and ladders name (74 rows).
- **Stack (D-016):** TypeScript, React 19, Vite 8, Tailwind 4, TanStack Router, zod 4, lucide-react, Biome, Vitest 4,
  Playwright (WebKit), pnpm, GitHub Pages. A first-party service worker (D-017); hand-made SVG charts (D-019).

## Pitfalls

- **Evidence that is easy to overstate:** `ai/memory/evidence-pitfalls.md`. The review of 2026-11-21 found eight
  findings that said more than their raw text; the same slips come back whenever a finding is written from memory.
- **The address is the data:** IndexedDB belongs to the exact origin, so moving the app strands the phone's data until
  an export and import (D-010).
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
  extension and core ladders number their levels 1, 2, 3 instead of B1 or C1.

## Background

- The repo started on 2026-11-21 as an empty public repo; the plan landed the same evening.
- The owner asked for a review of all documents that night ("review all docs and fix all issues"). Every source was
  read again in its raw text, and the review closed with D-029 to D-035.
- Ideas, and 19 sources already checked in their raw text, came from the owner's Straight Back page
  (<https://money.doctornova.net/posture>).
- DNS: doctornova.net uses GoDaddy nameservers (domaincontrol.com); `money.doctornova.net` is a CNAME to
  `mortal-dog.github.io`.
