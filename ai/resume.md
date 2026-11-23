<!-- The handoff sheet of this repo (protocol: ~/Repo/script/claude/resume.md).
     The launchd backstop com.zerodte.resume reads the section from `# In progress` to the first `---`;
     notes go in this comment, never inside the section. Finished entries move to resume-done.md.
     This repo is PUBLIC: no personal health or household facts in this file. -->

# In progress

## 2026-11-23: play the exercise videos inside the app — started 2026-11-23 17:57 ET

**Why:** the owner (translated): "can the video play inside the app instead of leaving it?"; his picker: "play in the
app, load only on tap" (rule 7 gains YouTube's no-cookie player, only after a tap).

**Steps**
- [x] ♻️ check every video in src/data/videos.ts allows embedding (playableInEmbed); replace any that does not
- [x] ♻️ a video sheet: tap the name → dialog with a youtube-nocookie iframe (+ "Open in YouTube"); CSP frame-src;
      referrer policy so YouTube's embed accepts it
- [x] ♻️ CLAUDE.md rule 7, D-060, design doc, plan Appendix A paragraph; tests
- [x] ♻️ gates green: check, 267 Vitest, build, 17 e2e; all 44 videos playableInEmbed; the embed loads in real Chrome
- [x] ⚠️ committed (see git log: "the exercise videos play inside the app") — check git log before committing again
- [x] ♻️ the cut to 35 done: data, plan doc, Appendix A, D-061; 267 Vitest green
- [x] ♻️ later ask (done, D-062, gates green 263 Vitest + 16 e2e): remove from Progress: outdoor sessions, The Shell, photos, test trends, levels over time
      (then "finally commit push and compact")
- [ ] ⛔ push: his picker "push together after the cut" — push ec23c75 + the cut commit together once gates are green
- [ ] ♻️ later ask: "48 still too many" → his picker "cut to 33" (it is 35: the table miscounted cardio as 6):
      splits 12→6 (drop seated straight-leg raise, frog, horse stance, side-lying leg raise, 90/90, puppy pose; blocks
      hold 2 positions longer); handstand 12→9 (bail into kick-up, back-to-wall into freestanding, drop wall HSPU:
      strength track S1–S3 pike push-ups); strength 13→10 (drop bodyweight squat → unloaded squats in the warm-up,
      step-up → Wed B1 is the squat ladder, half-kneeling press → Friday A1 wide goblet / A2 push-up / B1 row / B2 side
      plank); cardio 5→4 (run-walk + easy run → Run, no video). D-061.

---
