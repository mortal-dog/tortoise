---
name: evidence-pitfalls
description: "Evidence in docs/sources.md that is easy to overstate when the plan becomes data: the Rockport equation's form, static vs PNF stretching, the VO2max decline slope, the strength J-curve, small or non-significant studies, and the citations dropped on 2026-11-21"
metadata:
  type: project
---

- **Rockport (kline1987):** the abstract gives only the L/min equation:
  6.9652 + 0.0091 × weight (lb) − 0.0257 × age + 0.5955 × sex − 0.2240 × time (min) − 0.0115 × heart rate.
  - The widely quoted mL/kg/min version (132.853 − …) is not in the abstract.
  - The app converts: L/min × 1000 ÷ weight (kg).
  - Valid for ages 30–69.
- **Stretching (thomas2018):** static holds beat ballistic and PNF stretching. Weekly frequency (at least 5 days) and
  weekly time matter; the length of one session does not. So the splits use static holds (D-027), and contract–relax
  was dropped from the plan.
- **Aerobic decline (fleg2005):** the rate was similar in every activity quartile. Training raises the starting point,
  not the slope; never write "training slows the decline".
- **Strength dose (momma2022):** the largest mortality reduction came at about 30–60 min a week. Above that the effect is
  "unclear", not "harmful".
- **Generation 100 (stensvold2020):** a hazard ratio of 0.63 with a confidence interval of 0.33–1.20. That is a trend, not
  a proven effect.
- **Push-ups (yang2019):** only 37 events, in male firefighters: small and observational.
- **Citations removed before the first commit** because the checked finding did not say it:
  - [octftf] for "a load overhead presses down along the spine";
  - [octftf] for "one leg makes a squat heavy";
  - [ros2022] for "1 litre of water = 1 kg", which is physics and needs no source.
  The Straight Back page had attributed those to the source, but they were its own reasoning.

**Why:** these are the places where a summary, or a hurried port into plan data, would claim more than the evidence
shows.

**How to apply:** when encoding the Phase 1 data or editing the plan, keep these phrasings. Re-read the raw abstract
before changing any of them.
