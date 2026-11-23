# Tortoise — rules for AI sessions in this repo

Tortoise is a private, offline iPhone app (a PWA) for a 60-year exercise plan: the goal is a straight back, jumping and
running at 99, plus a handstand and the splits. It covers exercise only.

**Status:** building. Phases 0 to 7 and Phase 9's offline parts are done (2026-11-22); Phase 8, the deployment and the
phone checks, is next. See `docs/3-implementation.md`.

## Map

| File | Holds |
|---|---|
| `docs/plan.md` | The general plan: goals, the three parts, constraints, status |
| `docs/1-app-design.md` | Screens, rules (calendar, streak, progression), data model, iPhone constraints, visual design |
| `docs/2-exercise-plan.md` | The week, every session and dose, progression ladders, the first 13 weeks, the stages to 99, the Tortoise Test, milestones, safety, the exercise library |
| `docs/3-implementation.md` | Stack, phases 0–9 with done-criteria, testing, deploy, risks |
| `docs/decisions.md` | Every decision as a D-number (the next number is at the top) |
| `docs/sources.md` | Every source, with the finding read in its raw text |
| `ai/resume.md` | The handoff sheet (global §0); finished entries move to `ai/resume-done.md` |
| `src/data/` | The plan as data (schema, sessions, ladders, tests, milestones, sources); changes with the plan docs (rule 6) |
| `src/lib/` | The rules as pure functions (calendar, streak, progression, daylight, milestones) and the IndexedDB layer |
| `src/routes/`, `src/components/` | The screens (TanStack Router, file-based) |
| `tests/` | Vitest (`unit`, `content`, `db`, `component`, `guard`) and Playwright (`e2e`) |

## Rules

1. **This repo is public.** No personal facts go in any committed file: not in docs, code, tests, `ai/now.md`, `ai/memory/`
   or commit messages. That covers health answers, family, employer, home city, and an exact age or birth date. Profile
   values live only on the phone (D-022). When `compact-ai` runs here, `ai/now.md` and `ai/memory/` hold project facts
   only.
2. **English only** in committed files.
3. **Gates before every commit of code:** `pnpm check && pnpm test && pnpm build && pnpm e2e`, chained with `&&`.
   The personal-term guard needs the untracked key file `.guard-key` (D-034); add a term with `pnpm guard:hash`.
4. **Numbers need sources.**
   - A number in the plan names a source in `docs/sources.md`.
   - The source must be read in its raw text (a PubMed abstract via E-utilities, a full text or a guideline), never a
     search or AI summary.
   - The plan's own choices are marked *our rule*.
5. **Decisions** get a D-number in `docs/decisions.md`.
   - The owner's decisions go through a picker.
   - Construction choices are builder's rulings, which the owner may overturn.
6. **Docs and data change together** (from Phase 1). A plan change updates `docs/2-exercise-plan.md`, the plan data and,
   for a number, `docs/sources.md`, in one commit.
7. **UI rules:**
   - no grey for text, labels or icons, only for disabled controls;
   - iPhone first; offline;
   - no third-party requests at runtime, except Google's sign-in and Drive, only after the user signs in for the
     Drive backup (D-054);
   - English UI.
8. **Publishing:** CI/CD (`.github/workflows/ci.yml`) runs twice a day and by hand, never on a push (D-039). Once Phase 8
   sets up GitHub Pages, it publishes whatever is on `main`, so a push to `main` needs a picker first.

## Commands

| Command | Does |
|---|---|
| `pnpm dev` | The dev server (no service worker, no Content Security Policy) |
| `pnpm check` | Biome, then TypeScript for the app and for the service worker |
| `pnpm test` | Vitest: unit, content, database, component and guard tests |
| `pnpm build` | The production build in `dist/`, with the precache list and the security policy |
| `pnpm e2e` | Playwright on WebKit's iPhone profile; it builds and serves `dist/` itself |
| `pnpm icons` | Redraws the app icons in `public/` |
| `pnpm guard:hash < file` | Adds banned personal terms, one per line, to the guard list as keyed hashes |
