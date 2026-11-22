---
name: building-pitfalls
description: "Pitfalls met building Phases 0–3: agent worktrees under .claude/ break Biome and the guards unless ignored; Playwright clock, locators and async checkboxes; TypeScript 7 with DOM and WebWorker libs; NOAA reference values read from the spreadsheet, not by running NOAA's script; vitest TZ; full-page screenshots"
metadata:
  type: project
---

- **Agent worktrees:** a subagent with `isolation: worktree` works in `.claude/worktrees/<name>/`, inside the repo.
  Biome then found a second `biome.json` and refused to run, and the guards' `git ls-files --others` would have read
  the copy. `.claude/` is in `.gitignore` since `491994c`. The worktree started at an old commit and the agent
  fast-forwarded it; merge its branch by `git cherry-pick`.
- **TypeScript 7:** the DOM and WebWorker libs conflict in one program, so the service worker has its own
  `tsconfig.sw.json`, and `pnpm check` runs `tsc` twice.
- **The service worker build:** a second Vite (Rolldown) input `src/sw/sw.ts` emitted as `sw.js`; the plugin replaces
  `__PRECACHE__` and `__VERSION__` in `generateBundle` and throws if they are missing. The worker imports nothing, so
  no shared chunk can appear.
- **Playwright:**
  - day travel: `page.clock.setFixedTime(new Date('…T09:00:00Z'))`, then `page.reload()`; IndexedDB survives.
  - `getByRole(name)` matches a substring: two links "Week" and "Back to the week" collide; use `exact: true`.
  - `locator.check()` failed on a checkbox whose state comes back from IndexedDB after the write; the control now shows
    the tap at once (local state, synced from the stored value).
  - `fullPage` screenshots draw the fixed tab bar in the middle of the page; it is an artefact, not a layout bug.
  - offline is proven by a fetch of an uncached URL that must fail; `context.setOffline` alone proves nothing.
- **Vitest:** `process.env.TZ = 'Europe/London'` at the top of `vitest.config.ts` gives every worker a zone with
  daylight saving; `-0` from `-getTimezoneOffset()` fails `toBe(0)`.
- **NOAA reference values:** running NOAA's calculator script (`gml.noaa.gov/grad/solcalc/main.js`), even in a node
  `vm`, was refused by the auto-mode classifier. The values were read as data from NOAA's published
  `NOAA_Solar_Calculations_year.xls` (`uv run --no-project --with xlrd python -I`, columns 23–26: solar noon, sunrise,
  sunset in day fractions, day length in minutes; its own example 40° N, 105° W, zone −7, year 2010). The sheet makes
  one pass at noon, so the test tolerance is 1 minute.
- **Bugs the Phase 2 tests caught:** with one log, `slice(-2)` put it in `prev`, not `latest` (use `at(-1)`/`at(-2)`).

**Why:** each cost a failed gate or a refused step on 2026-11-22.

**How to apply:** check these first when a gate fails in the same place ([[guard-tests]]).
