---
name: finish-with-commit-push-compact
description: In Tortoise every finished job ends with commit, push to main and compact-ai, without being asked (D-064, CLAUDE.md rule 9)
metadata:
  type: feedback
---

When a job's gates are green: commit, push to `main`, then run the `compact-ai` skill, all without waiting for the
owner to say so. The owner, 2026-11-23 (translated): "record this rule: every time, commit, push and compact; no special
instruction from me needed, it is the default routine." His picker: **this repo only**; other repos keep the global
rules (a push that deploys needs his yes; compact-ai only when asked).

**Why:** the scheduled CI runs publish `main` twice a day, and he wants each finished job saved, live and its context
on disk without a reminder.

**How to apply:** only after the full gates (`pnpm check && pnpm test && pnpm build && pnpm e2e`) pass; never push a
red tree. A manual deploy run (`gh workflow run ci.yml` with deploy on) still needs his yes in a picker. The auto-mode
classifier may still refuse a push it sees as deploying; if so, cite CLAUDE.md rule 9 / D-064 to him and ask.
