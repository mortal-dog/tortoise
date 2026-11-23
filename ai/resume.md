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
- [ ] ⚠️ commit (check git log first)
- [ ] ⛔ push only after the owner's yes (his earlier "commit and push" covered the last batch only)

---
