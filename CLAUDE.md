# Tortoise — rules for AI sessions in this repo

Tortoise is a private, offline iPhone app (a PWA) for a 60-year exercise plan: the goal is a straight back, jumping and
running at 99, plus a handstand and the splits. It covers exercise only.

**Status:** planning. No code until the owner starts Phase 0 of `docs/3-implementation.md` (D-021).

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

## Rules

1. **This repo is public.** No personal facts go in any committed file: not in docs, code, tests, `ai/now.md`, `ai/memory/`
   or commit messages. That covers health answers, family, employer, home city, and an exact age or birth date. Profile
   values live only on the phone (D-022). When `compact-ai` runs here, `ai/now.md` and `ai/memory/` hold project facts
   only.
2. **English only** in committed files.
3. **No code yet** (D-021). Until the owner starts Phase 0, work stays in `docs/`.
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
   - no third-party requests at runtime;
   - English UI.
8. **Publishing:** once Phase 8 sets up deployment, a push to `main` publishes the site, so ask with a picker first.

## Commands

None yet; Phase 0 adds `pnpm check`, `pnpm test`, `pnpm build` and `pnpm e2e`.
