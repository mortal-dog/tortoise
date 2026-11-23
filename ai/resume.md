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

(4a) DONE in the commit "feat: a smaller app: no habits, daylight, reminders or raindrops (D-053)" (gates green: 281
Vitest, 21 e2e).

**Next:** (4b) the Google Drive backup, its own commit and D-054: port the French repo's `src/features/sync/google.ts`
(GIS token model, scope `drive.appdata` + email, session in localStorage), `drive.ts` (list/read/create/update in
`appDataFolder`) and `sync.ts` (one file per device, merge by `updatedAt` as the backup import does, D-032) into
`src/lib/sync/`; reuse the French app's `GOOGLE_CLIENT_ID` (its `src/lib/constants.ts`); CSP: allow
`https://accounts.google.com` (script, frame, connect) and `https://www.googleapis.com` (connect); auto-sync on open,
on return after a few minutes, when hidden, and after a session is saved, only with a live token; an expired token
waits for a tap ("Sync now"). Settings: a Google card above the file fallback (kept by the owner's picker); the Today
backup reminder only when Drive is not signed in. Owner step: add `https://tortoise.doctornova.net` as an authorised
JavaScript origin on that client; Settings says so when Google refuses the origin. Then NO push without a picker.

---
