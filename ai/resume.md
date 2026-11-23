<!-- The handoff sheet of this repo (protocol: ~/Repo/script/claude/resume.md).
     The launchd backstop com.zerodte.resume reads the section from `# In progress` to the first `---`;
     notes go in this comment, never inside the section. Finished entries move to resume-done.md.
     This repo is PUBLIC: no personal health or household facts in this file. -->

# In progress

## Adjustment by asking (owner pickers 2026-11-23, D-069) — after D-067 is committed
- Owner: doses fixed in the session (no rep steppers, no easy/right/hard feedback); the app asks per exercise
  "one level harder / keep / one level easier"; easier → later asks are relative to the lower level.
- Pickers: ask right after the session, only the ladders due in it; cadence by type: strength 2 weeks, skills
  (handstand, balance) 3 weeks, run-walk 1 week, jumps 4 weeks, 1 week after an "easier"; first run: about 5 concrete
  yes/no questions (push-ups, easy-run minutes, one-leg 30 s, handstand experience, deep squat) set starting levels.
- Also: no "harder" at a ladder's top; after 14+ days off the first ask leads with "easier".
- Builder design: Ladder.askEveryDays (strength 14, handstand-skill/balance 21, run 7, jumps 28); LevelRecord
  askedAt + eased; start rules pushups 0/5/15/30 → L1–L4, runMin 0/10/30 → R1/R4/R8, oneLeg30 → Ba2,
  handstandWall30 → H8, trains → squat/bridge/row/back L2; FirstRun choice buttons preset to the lowest; player: no
  reps/kg steppers, no feedback step, summary without effort and note (distance stays for the km badges), a check-in
  section for due ladders, Save needs every answer; Today: no suggestion banner; progression.ts → checkIns().
- Steps done: none yet (check git status).

---
