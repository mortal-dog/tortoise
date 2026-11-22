<!-- The handoff sheet of this repo (protocol: ~/Repo/script/claude/resume.md).
     The launchd backstop com.zerodte.resume reads the section from `# In progress` to the first `---`;
     notes go in this comment, never inside the section. Finished entries move to resume-done.md.
     This repo is PUBLIC: no personal health or household facts in this file. -->

# In progress

## Phases 0 to 3 (scaffold, plan as data, storage and logic, Today and Week) — started 2026-11-22 07:24 ET

**Why:** owner 2026-11-22: "implement phase 0 to 3" (starts Phase 0, ends D-021's no-code rule).

**Steps** (docs/3-implementation.md §4; gates `pnpm check && pnpm test && pnpm build && pnpm e2e` once per phase)
- [ ] Phase 0: scaffold, tokens, PWA, service worker, CSP, guard tests, CI and deploy workflows, CLAUDE.md commands
- [ ] Phase 1: the plan as data (src/data), zod schemas, content tests, debug week screen
- [ ] Phase 2: IndexedDB wrapper, calendar, streak, progression, units, daylight, milestones, edge-case tests
- [ ] Phase 3: tab bar, first run, Today, Week, e2e of a full day, a Shell day and a sick day
- [ ] docs and decisions updated to what was built; commits by pathspec; push only after the owner's picker yes

**Don't forget:** check real state with `git log` before redoing any step; the next D-number is D-036; no personal
facts in any committed file.

---
