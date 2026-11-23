---
name: exercise-videos
description: How Tortoise's exercise videos were chosen and checked (D-056): storyboard frames, the order of channels, NO_VIDEO, Appendix A generated from the data, and how to redo one
metadata:
  type: project
---

Every exercise is a well-known name plus one YouTube video (`src/data/videos.ts`, 44 videos for 48 exercises); the
everyday ones in `exercises.ts` `NO_VIDEO` (rope-basics, run-walk, easy-run, walk) have none. The owner: "use only
well-known exercises with their own names, easy to judge; jump rope, running and walking need no link".

**How a video was checked (2026-11-23):** not by its title. The watch page (`curl -sL -A 'Mozilla/5.0'`) holds
`playerStoryboardSpecRenderer.spec`; its last level gives 3×3 sheets of stills through the whole video
(`$L` → level, `$N` → `M0`, `M1`…, plus `&sigh=`); opened with Read they show the movement. Title and channel come from
`https://www.youtube.com/oembed?url=…&format=json`, recorded exactly (one channel, "Hip Pilates Method ", ends in a
space). Order of choice: a health body or physiotherapist, then an established coach or professional body; short, one
movement, the plan's equipment (dumbbells, rope, wall, chair, sofa, stair, floor). A tiny storyboard (81×45 px, an NIA
video) cannot be checked: pick another.

**Appendix A of `docs/2-exercise-plan.md`** is the name → video table, regenerated from the data whenever a name or
video changes; `tests/content/plan.test.ts` compares it row by row (a no-video row reads "None: everyone knows it").
The doubts noted per video are in `ai/now.md` (open work). The bail has no step of its own (H10 holds it) and keeps its
video as the safety skill; the "no exercise unused" test lists it as the one exception.
