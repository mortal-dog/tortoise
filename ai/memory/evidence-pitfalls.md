---
name: evidence-pitfalls
description: "Evidence in docs/sources.md that is easy to overstate when the plan becomes data: the Rockport equation's form, static over PNF, the VO2max slope, the strength J-curve, small or non-significant studies (nielsen2014, stensvold2020, yang2019), animal and postmenopausal-only studies, a likelihood ratio, findings that live in a full text or an appendix, and the citations dropped on 2026-11-21"
metadata:
  type: project
---

**Standing pitfalls**

- **Rockport (kline1987), history only since D-067 removed the test and the source:** the abstract gives only the L/min equation:
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
- **Push-ups (yang2019):** only 37 events, in male firefighters: small and observational. The benchmark is "more than
  40", not "40 or more".
- **Citations removed before the first commit** because the checked finding did not say it:
  - [octftf] for "a load overhead presses down along the spine";
  - [octftf] for "one leg makes a squat heavy";
  - [ros2022] for "1 litre of water = 1 kg", which is physics and needs no source.
  The Straight Back page had attributed those to the source, but they were its own reasoning.

**Found when every source was read again on 2026-11-21** (the first findings said more than the text)

- **Running progression (nielsen2014):** not statistically significant. Hazard ratio 1.59, confidence interval
  0.96–2.66, p = 0.07; injury rates overall did not differ. Write "seemed more prone", never "had more injuries".
- **Intervals (helgerud2007):** the interval groups raised VO2max "significantly more than" the steady groups. The
  abstract does not say that only they improved.
- **Fitness and survival (mandsager2018):** low fitness carried a risk "comparable to or greater than" smoking, diabetes
  or coronary disease. It does not say fitness is the measure most strongly linked to survival. The patients had been
  referred for treadmill testing.
- **Strength against stretching (afonso2021):** "no differences", in highly heterogeneous trials. "Through a full
  range" was the plan's own addition, not the paper's.
- **HRmax (tanaka2001):** the abstract gives no spread around the formula, so no "10 beats off" number.
- **Wall test (green2004):** 4.6 is a positive likelihood ratio. It multiplies the odds, not the probability, and the
  review was about women.
- **Static load (lanyon1984):** an animal experiment on a bird's wing bone, and the abstract is truncated.
- **Who was studied:** ma2013 and howe2011 are women around or after menopause; liftmor2018, liftmor2019 and
  harding2020 are people with low bone mass; kado2004, kado2005 and sheaf2017 are older adults; ros2022 is advice for
  people with osteoporosis. Say so when quoting them for a healthy adult.
- **UK consensus (ros2022):** "impacts above 4 times body weight" is Australian advice that it reports. Its own
  recommendation is moderate impact.
- **Canadian guideline (oc2023):** the signs for spine imaging (height down more than 2 cm measured or 6 cm by history,
  head more than 5 cm from the wall, ribs within 2 finger-widths of the pelvis) are in Appendix 1, Table 6, not in the
  article. "Measured" loss is against an earlier measurement, so the app compares with the tallest earlier record,
  not only the last one.
- **Kyphosis review (katzman2010):** its numbers are in the full text (Table 1, Figure 4); the abstract has none.
- **Vitamin D (webb1988):** it gives the months without synthesis at 42° N and 52° N. It says nothing of midday.
- **Quotations:** pedisic2020's sentence is "Any amount of running, even just once a week, is better than no running".
  A shortened version in quotation marks is a misquote.
- **Long stretching programmes (weppler2010):** programmes longer than 8 weeks had not been measured, so no claim
  about what they change in the muscle.

**Why:** these are the places where a summary, or a hurried port into plan data, would claim more than the evidence
shows.

**How to apply:** when encoding the Phase 1 data or editing the plan, keep these phrasings. Re-read the raw text
before changing any of them ([[reading-sources-raw]]).
