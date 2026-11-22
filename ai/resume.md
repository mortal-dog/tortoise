<!-- The handoff sheet of this repo (protocol: ~/Repo/script/claude/resume.md).
     The launchd backstop com.zerodte.resume reads the section from `# In progress` to the first `---`;
     notes go in this comment, never inside the section. Finished entries move to resume-done.md.
     This repo is PUBLIC: no personal health or household facts in this file. -->

# In progress

## Phases 4-9 and scheduled CI/CD (owner 2026-11-22, 08:5x ET: "do all the remaining phases"; CI/CD "twice a day like the other repos, plus manual, so pushes never trigger a run")

- **Plan:** (1) CI/CD: one workflow on a schedule (13:07 and 23:07 UTC) plus manual, skipping a slot when main has not
  changed since the last green run (as mortal-dog/french); D-039. (2) Phase 4 player (main session). (3) Phases 5 and 7
  by worktree agents, at most 2 at once, each committing on its own branch; cherry-pick, then gate the merged tree.
  (4) Phase 6. (5) Phase 8 code parts; the domain steps and the push wait for the owner's picker. (6) Phase 9: progress
  photos and spoken coaching (offline); the weather hint is an owner decision (D-020, a third-party request).
- **Done:** `35f88ff` CI/CD (D-039); `d8e112c` Phase 4 (D-040); `97cd9a1` Phase 6 (D-041); `c332503` Phase 7 (D-042,
  merged from its agent, with the wizard's Finish race fix); `7f3b5be` Phase 5 (D-043, merged). Gates green on
  `7f3b5be`. Nothing pushed. Agent worktrees removed.
- **Done:** Phase 9 offline parts (D-044) and the status lines: committed with this sheet.
- **Next:** one picker: push to main, the Pages settings (Phase 8 step 2), and the weather hint (D-020, D-044).
- **Don't forget:** gates before every code commit; no push without a picker; e2e port per worktree
  (`TORTOISE_E2E_PORT`); check `git log` before redoing any step.

---
