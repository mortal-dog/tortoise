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
- **Done:** step 1 committed `35f88ff` (not pushed). Step 3 started ~09:05 ET: agents in worktrees under `.claude/worktrees/`, Phase 7 (e2e port 4181) and Phase 5 (port 4182); their decision entries get renumbered at merge to follow main's; they commit on their own branches, never push.
- **Done:** step 2, Phase 4 committed `d8e112c` (D-040; not pushed).
- **Done:** Phase 7 agent finished: branch `worktree-agent-a8de0d5cbc53c2691`, commit `bbc2824` (its decision entry and a placeholder entry need renumbering at merge).
- **Next:** commit Phase 6 (decision entry on main after Phase 4's), then cherry-pick `bbc2824`, then Phase 5's branch when it reports.
- **Don't forget:** gates before every code commit; no push without a picker; e2e port per worktree
  (`TORTOISE_E2E_PORT`); check `git log` before redoing any step.

---
