<!-- The handoff sheet of this repo (protocol: ~/Repo/script/claude/resume.md).
     The launchd backstop com.zerodte.resume reads the section from `# In progress` to the first `---`;
     notes go in this comment, never inside the section. Finished entries move to resume-done.md.
     This repo is PUBLIC: no personal health or household facts in this file. -->

# In progress

## Delete the Tortoise Test (owner pickers 2026-11-23, D-067)
- Pickers: "Delete it all"; ability badges "Earn them by reaching ladder levels"; At 99 deleted.
- Scope: test route/screen/components, test days in calendar, Progress button, test-repo/test-results, plan §8 Week 0
  test + test section, at99, test-only sources; start question → plan setup; levels start L1; badges by ladder level.
- Plan: (1) data: delete tests.ts, at99.ts, TestDef/At99Line/Calculator, blockRules testEveryBlocks/testDays; start
  rule keeps only run (asked at plan setup, FirstRun); Week 0 half volume Mon–Sun; milestones: ability badges by
  ladder level (kind 'level', ladderId, max level ever in LevelRecord history) + split blocks done (count) + run logs;
  (2) lib: calendar no test weeks/days; test-repo → milestone-repo (awardMilestones, loadMetrics); test-results gone;
  DB `tests` store and TestRecord kept for old data (like photos); (3) UI: test route + components/test gone, Today,
  Day, Week, Progress (no Test button, no At 99), play guard; (4) tests; (5) docs: plan §8, §10, §11, Appendix,
  sources orphaned, design §3.5 etc., plan.md, weekly hours (Week 0 now 7 days half volume), D-067.
- Steps done (uncommitted, check git status): data/schema/milestones/badges/calendar/repo/start-levels, routes,
  unit+db tests, the four test-only sources removed (oc2023 kept via a §9 rationale entry: still to add). Next: e2e
  (test-wizard.spec → progress spec), docs (plan §8 §9 §10 §11, design §3.4 §3.5 §5.1 §6 §8, plan.md, hours), D-067.

## Adjustment by asking (owner pickers 2026-11-23, D-068) — after D-067 is committed
- Owner: doses fixed in the session (no rep steppers, no easy/right/hard feedback); the app asks per exercise
  "one level harder / keep / one level easier"; easier → later asks are relative to the lower level.
- Pickers: ask right after the session, only the ladders due in it; cadence by type: strength 2 weeks, skills
  (handstand, balance) 3 weeks, run-walk 1 week, jumps 4 weeks, 1 week after an "easier"; first run: about 5 concrete
  yes/no questions (push-ups, easy-run minutes, one-leg 30 s, handstand experience, deep squat) set starting levels.
- Also: no "harder" at a ladder's top; after 14+ days off the first ask leads with "easier".

---
