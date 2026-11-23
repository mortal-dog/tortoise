---
name: exercise-videos
description: How Tortoise's exercise videos were chosen and checked (D-056, D-060, D-061): storyboard frames, embeddability, the order of channels, NO_VIDEO, Appendix A generated from the data
metadata:
  type: project
---

Every exercise is a well-known name plus one YouTube video (`src/data/videos.ts`, 32 videos for 35 exercises since
D-061); the everyday ones in `exercises.ts` `NO_VIDEO` (rope-basics, run, walk) have none. The owner: "use only
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
The doubts noted per video are in `ai/now.md` (open work). Since D-061 every exercise is used by a step or a ladder
level (the bail lives in H10 with the kick-up video).

**Played in the app (D-060):** a new video must allow embedding: the watch page's `"playableInEmbed":true` with
playability `OK` (all were, 2026-11-23). The player is `https://www.youtube-nocookie.com/embed/<id>?playsinline=1&rel=0`
with `referrerPolicy="strict-origin-when-cross-origin"` (YouTube's embed refuses a request without a referrer);
the CSP's frame-src allows that host only.
