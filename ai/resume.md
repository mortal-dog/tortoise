<!-- The handoff sheet of this repo (protocol: ~/Repo/script/claude/resume.md).
     The launchd backstop com.zerodte.resume reads the section from `# In progress` to the first `---`;
     notes go in this comment, never inside the section. Finished entries move to resume-done.md.
     This repo is PUBLIC: no personal health or household facts in this file. -->

# In progress

## CI: the glass theme made the e2e tests 2-3x slower and the player test flaky — started 2026-11-22 15:13 ET

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

**Next**
- [ ] ♻️ run compact-ai at the end (the owner asked)

---
