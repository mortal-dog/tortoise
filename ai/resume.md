<!-- The handoff sheet of this repo (protocol: ~/Repo/script/claude/resume.md).
     The launchd backstop com.zerodte.resume reads the section from `# In progress` to the first `---`;
     notes go in this comment, never inside the section. Finished entries move to resume-done.md.
     This repo is PUBLIC: no personal health or household facts in this file. -->

# In progress

## 2026-11-23: beginner handstand ladder, the day's timing, and no pocket lock (owner's asks)

**What:** three owner asks, all decided (pickers 2026-11-23): (1) the handstand skill track H1 (feet on the wall in an L)
is too hard for a beginner and "6 min" reads as a 6-minute hold: add gentle floor and low-wall levels in front, hold-based
doses, the slot is a time box, not a hold; (2) make the day's timing explicit: morning block after waking; main session at
lunch to mid-afternoon, at least 3–4 h after the morning block; the split block right after the main session in the same
sitting (drink and 2 min), no separate sitting; (3) remove the pocket lock (the "Hold to unlock" layer) and keep the screen
awake whenever the app is open (wake lock for the whole app, not only a started session).

(4) **Owner's later asks, same day (a settings and scope sweep):** delete the Habits part (no tracking); delete Settings'
dumbbell weight, Daylight, Runs, Display, Reminders and Storage cards; keep the glass theme but delete the raindrops
(`src/lib/rain.ts` and its use); replace Backup with a Google sign-in and a Google Drive backup, modelled on the French
repo's `src/features/sync/{google,drive,sync}.ts` (token model, `drive.appdata` scope, one file per device), syncing by
itself at suitable moments.

**How far:** (3) DONE `a512c90` (D-050). (1) and (2) DONE in the commit "plan: a beginner's handstand ladder and the
day's timing" (D-051, D-052; gates green: 315 Vitest, 22 e2e). (4) the owner's pickers 2026-11-23: habits go entirely,
the plan's advice too (steps, snacks, outdoors, and their now unused sources); the file export/import stays as a small
fallback under the Drive backup; the Drive sync reuses the French app's Google client ID (the owner adds
`https://tortoise.doctornova.net` as an authorised JavaScript origin; the Settings screen must say when that is missing).

**Next:** (4a) the deletions, one commit: Habits (Today card, `src/data/habits.ts`, day records' `habits`, milestones and
counts built on them, plan §4 row and the habits section, unused sources), Settings' dumbbell weight, Daylight (+
`src/lib/daylight.ts`, Today's strip, location), Runs (`runDefault`), Display (moving-background switch; the motion
stays), Reminders (+ `src/lib/ics.ts`, `RemindersCard`), Storage card, raindrops (`src/lib/rain.ts`). Old records and
backups with the removed fields must still import. (4b) the Drive backup, its own commit. Gates before each commit;
NO push without a picker (CLAUDE.md rule 8).

---
