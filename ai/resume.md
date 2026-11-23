<!-- The handoff sheet of this repo (protocol: ~/Repo/script/claude/resume.md).
     The launchd backstop com.zerodte.resume reads the section from `# In progress` to the first `---`;
     notes go in this comment, never inside the section. Finished entries move to resume-done.md.
     This repo is PUBLIC: no personal health or household facts in this file. -->

# In progress

## 2026-11-23: safer, fewer exercises; no bar; no library page; stairs for rainy runs — started 2026-11-23 17:25 ET

**Why:** the owner, 2026-11-23 (translated): "change every exercise that is easy to do wrong and hurts you into
another one (by injury risk, not complexity); too many kinds of exercise, simplify; delete the library, each exercise
gets a name and a YouTube link, no text; replace every bar exercise, there is no bar, only dumbbells and a rope at home;
give running an alternative such as climbing stairs".
His pickers: keep the freestanding handstand goal (handstand drills unchanged); splits unchanged; the exercise name
opens YouTube, no library page; stairs replace the run indoors, the rope stays its own drill.

**Steps**
- [x] ♻️ read the plan doc, the data (exercises, ladders, sessions, tests, milestones, videos) and the library routes
- [x] ♻️ the new exercise list, 80 → 49 (builder's rulings, to record as D-056/D-057):
      removed pistol, scapular/archer/pseudo-planche push-ups, both RDLs, pullover, Nordic, Cossack, bent-over row,
      single-leg reach, Copenhagen, tibialis raise, hollow rock, L-sit, broad jump, single-leg hop, pogo, skater,
      strides, marching, easy cool-down (→ walk), brisk walk (→ walk), rope skills (→ rope, no double-unders or
      criss-cross), leg swings, upper-back extension, heel-to-toe walk, all 5 bar drills; added stair-climb.
      Hinge ladder → bridge ladder (bridge, single-leg, hip thrust on the sofa); pull ladder → one-arm row ladder;
      Friday: half-kneeling one-arm press, wide goblet squat; broad-jump and dead-hang tests → jump-and-reach test,
      farmer hold stays; pull-up and dead-hang milestones go. Thursday stays rope intervals (rope unchanged); stairs
      were the indoor version of the runs; then the owner's picker 2026-11-23 ("stairs hurt the knees?"): a longer brisk
      walk indoors instead, Tuesday 45–60 min, Saturday at most 60 min; stair-climb removed (80 → 48 exercises).
- [x] ♻️ a background agent checked one YouTube video per exercise by its storyboard frames → src/data/videos.ts;
      later ask: well-known names only (21 renamed), no video for rope, run–walk, easy run, walk (44 videos)
- [x] ♻️ plan doc + data + tests changed together; library routes gone; names link to YouTube
- [ ] ♻️ a checked YouTube link for every exercise (storyboard frames + title + channel)
- [x] ♻️ gates green 2026-11-23: check, 267 Vitest in 30 files, build, 17 e2e
- [x] ♻️ later ask (same turn, translated): a day page in Week, past or future, shows that day's exercises in full;
      a past day marks each exercise done or not, or says nothing was done. Remove the minutes / distance / effort /
      note fields and "Sick or injured" entirely: "the app does not care whether you are sick, injured or busy; only
      whether today's exercise is done, how much, and how far from the goal".
- [x] ♻️ later ask: Progress gets badges, one per milestone, Duolingo-like: grey until earned, tap or hover tells how
      to earn it, awarded automatically, never missed when earned (test each one), static with a shine effect, one
      consistent style (style is mine to choose).
- [x] ♻️ later ask: the tab bar flickers and shifts slightly when tabs are tapped; it must stay completely still.
- [x] ♻️ later ask: remove the "2/2" day ring from Today (done: DayRing.tsx deleted)
- [ ] ⚠️ commit (check git log first)
- [ ] ⛔ push: the owner asked for it himself, 2026-11-23 (translated): "finally, commit and push and compact by yourself"
- [ ] ♻️ then run compact-ai

---
