# Tortoise — now

<!-- Written only by the compact-ai skill. This repo is PUBLIC: project facts only, no personal facts (D-022), English
     only (the owner's words are quoted in English translation). -->

## Open work and next steps (as of 2026-11-21)

- **Nothing in flight.** The handoff sheet is empty. The plan is written, committed and pushed to origin/main:
  `14a550c` (the plan) and `c520ef6` (the Phase 8 DNS warning).
- **Next: Phase 0, scaffold and guardrails** (`docs/3-implementation.md` §4), **only when the owner starts it.** No code
  before that. The owner, 2026-11-21: "don't write any code; write all the plan documents first; prepare everything except
  code" (D-021).
  - Before starting, write the Phase 0 entry in `ai/resume.md` (global §0).
  - Phase 0 turns the doc checks of 2026-11-21 into guard tests (`ai/memory/doc-checks-for-phase-0.md`). In this public
    repo the banned-personal-terms test must compare **hashes** of tokens; a plain-text list would publish the very
    terms it guards.
- **Phase 8 owner steps wait for Phase 8.** First the GoDaddy DNS CNAME `tortoise` → `mortal-dog.github.io`, then
  domain verification if not yet done. A CNAME that exists before the repo claims the domain in its Pages settings
  invites a subdomain takeover.

## Standing rules (also in CLAUDE.md)

- **Public repo** (`mortal-dog/tortoise`, visibility PUBLIC): no personal facts in any committed file, including docs,
  code, tests, this file, `ai/memory/` and commit messages. Health answers given in pickers never go in. Profile values
  live only on the phone (D-022). Times in ai/ files are ET only.
- **English only** in committed files.
- **Numbers need sources**, each read in its raw text (`docs/sources.md`). The plan's own choices are marked *our rule*.
- **Decisions** get a D-number in `docs/decisions.md`; **the next is D-029**.
  - The owner's decisions go through a picker.
  - Construction choices are builder's rulings, which the owner may overturn.
- **Pushes:**
  - compact-ai pushes `ai/` as its job;
  - any other push to this public repo goes through a picker (the first one was approved in a picker on 2026-11-21);
  - from Phase 8 on, a push to main also deploys the site.
- **UI:**
  - no grey except for disabled controls;
  - iPhone first; offline;
  - no third-party requests at runtime;
  - English UI.
- **From Phase 1:** a plan change updates `docs/2-exercise-plan.md`, the plan data and (for a number) `docs/sources.md`
  in one commit.

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
  - a 15-min morning block plus a ~45-min main session;
  - Saturday long outdoor + playground, Sunday light;
  - about 7 h in a full week. That load was set under the owner's delegation: "you arrange the daily intensity" and
    "I have time".
- **App (D-010–D-014):**
  - iPhone; the address `https://tortoise.doctornova.net`, fixed forever, because the phone keeps data per origin;
  - data only on the phone; reminders by calendar file;
  - a Shell day counts, and the streak breaks only on two missed days in a row.
- **Cycle (D-015):** 4-week blocks (3 build + 1 light). The Tortoise Test comes in Week 0, then every 12 weeks in the
  light week.
- **Stack (D-016):** TypeScript, React 19, Vite 8, Tailwind 4, TanStack Router, zod 4, lucide-react, Biome, Vitest 4,
  Playwright (WebKit), pnpm, GitHub Pages. A first-party service worker (D-017); hand-made SVG charts (D-019).

## Pitfalls

- **Evidence that is easy to overstate** when the plan becomes data: `ai/memory/evidence-pitfalls.md`.
- **The address is the data:** IndexedDB belongs to the exact origin, so moving the app strands the phone's data until
  an export and import (D-010).
- **iOS web-app limits** to verify on the phone (design §2):
  - Web Push needs a server;
  - there is no Vibration API;
  - Web Audio starts only after a tap, and the silent switch may mute it;
  - wake lock in home-screen mode was broken on older iOS;
  - timers stop in the background.
- **Custom domain:** with an Actions deployment, GitHub Pages takes it from the Pages settings, not from a `CNAME` file.

## Background

- The repo started on 2026-11-21 as an empty public repo; the plan landed the same evening.
- Ideas, and 19 sources already checked in their raw text, came from the owner's Straight Back page
  (<https://money.doctornova.net/posture>).
- DNS: doctornova.net uses GoDaddy nameservers (domaincontrol.com); `money.doctornova.net` is a CNAME to
  `mortal-dog.github.io`.
