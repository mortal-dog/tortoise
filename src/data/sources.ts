// The sources of docs/sources.md, one entry per row: id, the "Source" cell without its link, the link, and the
// "Finding" cell verbatim. The content tests check that the ids match the doc exactly.
import type { z } from 'zod'
import type { Source } from './schema'

type SourceInput = z.input<typeof Source>

export const sources: SourceInput[] = [
  {
    id: 'mandsager2018',
    citation:
      'Mandsager et al. Association of cardiorespiratory fitness with long-term mortality among adults undergoing exercise treadmill testing. JAMA Netw Open 2018.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/30646252/',
    finding:
      '122,007 patients referred for treadmill testing, median follow-up 8.4 years. Risk-adjusted death rates fell with every step up in fitness. Elite against low fitness: adjusted hazard ratio 0.20 (low against elite: 5.04). Low fitness carried as much risk as smoking, diabetes or coronary disease, or more. The authors saw "no observed upper limit of benefit". Elite beat high fitness even at 70 or older (hazard ratio 0.71).',
  },
  {
    id: 'kodama2009',
    citation:
      'Kodama et al. Cardiorespiratory fitness as a quantitative predictor of all-cause mortality and cardiovascular events in healthy men and women: a meta-analysis. JAMA 2009.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/19454641/',
    finding:
      '33 studies, 102,980 people. Each 1 MET more of maximal aerobic capacity (about 1 km/h faster running speed): risk ratio 0.87 for death from any cause and 0.85 for heart and vascular events. Low fitness (under 7.9 METs) against high (10.9 or more): risk ratio 1.70 for death.',
  },
  {
    id: 'leong2015',
    citation:
      'Leong et al. Prognostic value of grip strength: findings from the Prospective Urban Rural Epidemiology (PURE) study. Lancet 2015.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/25982160/',
    finding:
      '139,691 adults aged 35–70 in 17 countries, median 4.0 years. Each 5 kg less grip strength: hazard ratio 1.16 for death from any cause. Grip predicted death better than systolic blood pressure.',
  },
  {
    id: 'yang2019',
    citation:
      'Yang et al. Association between push-up exercise capacity and future cardiovascular events among active adult men. JAMA Netw Open 2019.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/30768197/',
    finding:
      '1,104 male firefighters, mean age 39.6, followed 10 years. Men who could do more than 40 push-ups had an incidence rate ratio of 0.04 for heart and vascular events against men who could do fewer than 10. There were only 37 events, so it is a small, observational study.',
  },
  {
    id: 'momma2022',
    citation:
      'Momma et al. Muscle-strengthening activities are associated with lower risk and mortality in major non-communicable diseases: a systematic review and meta-analysis of cohort studies. Br J Sports Med 2022.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/35228201/',
    finding:
      '16 cohort studies. Muscle-strengthening went with a 10–17% lower risk of death, heart disease, cancer and diabetes. The largest reduction, about 10–20%, came at about 30–60 minutes a week (a J-shaped curve). The effect of larger volumes was unclear. Strength plus aerobic activity beat neither.',
  },
  {
    id: 'araujo2022',
    citation:
      'Araujo et al. Successful 10-second one-legged stance performance predicts survival in middle-aged and older individuals. Br J Sports Med 2022.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/35728834/',
    finding:
      '1,702 adults aged 51–75, median 7 years. 20.4% could not stand 10 seconds on one leg. For them the adjusted hazard ratio for death was 1.84.',
  },
  {
    id: 'reid2012',
    citation:
      'Reid, Fielding. Skeletal muscle power: a critical determinant of physical functioning in older adults. Exerc Sport Sci Rev 2012.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/22016147/',
    finding:
      'Muscle power declines earlier and more steeply with age than muscle strength, and peak power predicts functional limitation in older adults.',
  },
  {
    id: 'bull2020',
    citation:
      'Bull et al. World Health Organization 2020 guidelines on physical activity and sedentary behaviour. Br J Sports Med 2020.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/33239350/',
    finding:
      'Adults: 150–300 min of moderate or 75–150 min of vigorous aerobic activity a week, or a mix. Regular muscle-strengthening for all ages. Less sitting, though the evidence did not support a specific threshold.',
  },
  {
    id: 'helgerud2007',
    citation:
      'Helgerud et al. Aerobic high-intensity intervals improve VO2max more than moderate training. Med Sci Sports Exerc 2007.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/17414804/',
    finding:
      '40 moderately trained men, 3 sessions a week for 8 weeks, total work matched. Four groups: long slow distance at 70% of maximal heart rate (HRmax), threshold work at 85%, 15/15 intervals, and 4 × 4 min at 90–95% HRmax with 3 min at 70% between. The interval groups raised VO2max significantly more than the two steadier groups: by 5.5% (15/15) and 7.2% (4 × 4, from 55.5 to 60.4 mL/kg/min). Stroke volume rose about 10% after interval training.',
  },
  {
    id: 'fleg2005',
    citation:
      'Fleg et al. Accelerated longitudinal decline of aerobic capacity in healthy older adults. Circulation 2005.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/16043637/',
    finding:
      '810 adults aged 21–87, followed with repeated treadmill tests. Peak VO2 fell in every decade. The fall sped up from 3–6% per 10 years in the 20s and 30s to more than 20% per 10 years in the 70s and beyond. The rates were similar in every quarter of self-reported activity.',
  },
  {
    id: 'paterson1999',
    citation:
      'Paterson et al. Aerobic fitness in a population of independently living men and women aged 55–86 years. Med Sci Sports Exerc 1999.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/10613433/',
    finding:
      'The minimum aerobic power compatible with independent living at 85 was about 18 mL/kg/min in men and 15 in women.',
  },
  {
    id: 'stensvold2020',
    citation:
      'Stensvold et al. Effect of exercise training for five years on all cause mortality in older adults: the Generation 100 study. BMJ 2020.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/33028588/',
    finding:
      '1,567 adults aged 70–77 for 5 years. Interval training (2 sessions a week at about 90% of peak heart rate) against national advice: hazard ratio 0.63 for death, confidence interval 0.33–1.20. That is a lower trend, not a proven effect.',
  },
  {
    id: 'tanaka2001',
    citation: 'Tanaka, Monahan, Seals. Age-predicted maximal heart rate revisited. J Am Coll Cardiol 2001.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/11153730/',
    finding:
      'HRmax ≈ 208 − 0.7 × age in healthy adults (351 studies, 18,712 people, plus a laboratory check on 514). The same for men and women and at any activity level.',
  },
  {
    id: 'lee2014',
    citation:
      'Lee et al. Leisure-time running reduces all-cause and cardiovascular mortality risk. J Am Coll Cardiol 2014.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/25082581/',
    finding:
      '55,137 adults, 15 years. Runners: 30% lower risk of death from any cause and 45% lower from heart and vascular disease, and 3 years more life expectancy. Running 5–10 min a day at under 6 miles/h was enough. Persistent runners benefited most.',
  },
  {
    id: 'pedisic2020',
    citation:
      'Pedisic et al. Is running associated with a lower risk of all-cause, cardiovascular and cancer mortality, and is the more the better? Br J Sports Med 2020.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/31685526/',
    finding:
      '14 studies from 6 cohorts, 232,149 people. Any running: 27% lower risk of death from any cause. No significant dose-response for frequency, duration, pace or volume. "Any amount of running, even just once a week, is better than no running."',
  },
  {
    id: 'nielsen2014',
    citation:
      'Nielsen et al. Excessive progression in weekly running distance and risk of running-related injuries. J Orthop Sports Phys Ther 2014.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/25155475/',
    finding:
      '874 novice runners with GPS watches, followed for a year. Injury rates overall did not differ significantly between the groups. Those who raised their weekly distance by more than 30% over 2 weeks had more distance-related injuries than those who raised it by less than 10%, but that difference was not statistically significant either (hazard ratio 1.59, confidence interval 0.96–2.66, p = 0.07). The authors call the study exploratory and still advise novices to progress by less than 30% a week.',
  },
  {
    id: 'sherrington2019',
    citation:
      'Sherrington et al. Exercise for preventing falls in older people living in the community. Cochrane Database Syst Rev 2019.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/30703272/',
    finding:
      '108 trials, 23,407 people aged 60+. Exercise cut the rate of falls by 23% overall: balance and functional exercise by 24%, several types combined by 34%, tai chi by 19%. The effect of resistance training alone, dance or walking on falls was uncertain.',
  },
  {
    id: 'webb1988',
    citation:
      'Webb, Kline, Holick. Influence of season and latitude on the cutaneous synthesis of vitamin D3. J Clin Endocrinol Metab 1988.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/2839537/',
    finding:
      'On cloudless days, sunlight made no previtamin D3 in skin from November through February in Boston (42.2° N), and from October through March in Edmonton (52° N). Further south (34° N, 18° N) winter sun still made it.',
  },
  {
    id: 'thomas2018',
    citation:
      'Thomas et al. The relation between stretching typology and stretching duration: the effects on range of motion. Int J Sports Med 2018.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/29506306/',
    finding:
      '23 studies. Every kind of stretching improved range of motion over the long term; static stretching beat ballistic and PNF stretching. Weekly time (at least 5 min a week) and weekly frequency mattered; the length of a single session did not. Suggested: static stretching at least 5 days a week.',
  },
  {
    id: 'afonso2021',
    citation:
      'Afonso et al. Strength training versus stretching for improving range of motion: a systematic review and meta-analysis. Healthcare (Basel) 2021.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/33917036/',
    finding:
      '11 randomised trials, 452 people. Strength training and stretching did not differ in their effect on range of motion (effect size −0.22, confidence interval −0.55 to 0.12). The trials were highly heterogeneous.',
  },
  {
    id: 'weppler2010',
    citation:
      'Weppler, Magnusson. Increasing muscle extensibility: a matter of increasing length or modifying sensation? Phys Ther 2010.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/20075147/',
    finding:
      'After one session, and after short programmes of 3–8 weeks, more range of motion mostly reflects a changed sensation (greater stretch tolerance), not longer muscle. The effects of programmes longer than 8 weeks had not been measured.',
  },
  {
    id: 'ros2022',
    citation:
      'Brooke-Wavell et al. Strong, steady and straight: UK consensus statement on physical activity and exercise for osteoporosis. Br J Sports Med 2022.',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9304091/',
    finding:
      'A statement for people with osteoporosis (full text). Back-strengthening exercises repeated 3–5 times and held 3–5 seconds, at least twice a week. Strength training at the most that can be lifted 8–12 times, building to 3 sets. About 50 moderate impacts on most days. A straight upper back and a hip hinge for bending and lifting. Avoid sustained, repeated or end-range forward bending. After a spine fracture, impact only up to brisk walking. It reports Australian advice of impacts above 4 times body weight for people without osteoporosis, but itself recommends moderate impact, for lack of evidence that higher is better.',
  },
  {
    id: 'octftf',
    citation: 'Osteoporosis Canada. Too Fit To Fracture: exercise recommendations.',
    url: 'https://osteoporosis.ca/too-fit-to-fracture/',
    finding:
      'Balance exercise and muscle strengthening, each two or more times a week. Walking heel-to-toe is among its balance exercises. Planks, side planks and bird dogs for the abdominal and back-extensor muscles and posture.',
  },
  {
    id: 'oc2023',
    citation:
      'Morin et al. Clinical practice guideline for management of osteoporosis and fracture prevention in Canada: 2023 update. CMAJ 2023.',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10610956/',
    finding:
      'A guideline for postmenopausal women and for men of 50 or older (full text). Progressive resistance training at least twice a week, including the abdominal and back-extensor muscles. Spine imaging when height is down more than 2 cm measured (6 cm by history), the back of the head is more than 5 cm from the wall, or the ribs are within 2 finger-widths of the pelvis (its Appendix 1, Table 6). Bone density testing at 70 for everyone, at 65 with one risk factor, at 50–64 after a fracture or with two.',
  },
  {
    id: 'liftmor2018',
    citation:
      'Watson et al. High-intensity resistance and impact training improves bone mineral density and physical function in postmenopausal women with osteopenia and osteoporosis: the LIFTMOR randomized controlled trial. J Bone Miner Res 2018.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/28975661/',
    finding:
      '101 postmenopausal women with low bone mass. Eight months of twice-weekly, 30-minute supervised heavy lifting with jumps (5 × 5 above 85% of one-repetition maximum) raised spine bone density 2.9% against a 1.2% fall in controls.',
  },
  {
    id: 'liftmor2019',
    citation:
      'Watson et al. High-intensity exercise did not cause vertebral fractures and improves thoracic kyphosis in postmenopausal women with low to very low bone mass: the LIFTMOR trial. Osteoporos Int 2019.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/30612163/',
    finding:
      'In the same trial the upper-back curve, measured standing tall, fell 6.7° with training against 1.6° in controls, with no new spine fractures in the training group.',
  },
  {
    id: 'harding2020',
    citation:
      'Harding et al. A comparison of bone-targeted exercise strategies to reduce fracture risk in middle-aged and older men with osteopenia and osteoporosis: LIFTMOR-M semi-randomized controlled trial. J Bone Miner Res 2020.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/32176813/',
    finding:
      "93 men with low bone mass, mean age 67. Heavy resistance and impact training raised spine density 4.1% against 0.9% in controls. Isometric training on a machine that compresses the spine improved lean mass and chair-rise time over controls, but its spine density gain (2.0%) was significantly smaller than the heavy training's.",
  },
  {
    id: 'turner1998',
    citation: 'Turner. Three rules for bone adaptation to mechanical stimuli. Bone 1998.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/9823445/',
    finding:
      'Bone responds to dynamic, not static, loading; a short bout is enough to start the response; bone grows used to routine loading.',
  },
  {
    id: 'lanyon1984',
    citation: 'Lanyon, Rubin. Static vs dynamic loads as an influence on bone remodelling. J Biomech 1984.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/6520138/',
    finding:
      "An animal experiment on a bird's wing bone (the ulna). Over 8 weeks a bone under a constant load lost as much cross-section as an unloaded one (13% in both).",
  },
  {
    id: 'ma2013',
    citation:
      'Ma et al. Effects of walking on the preservation of bone mineral density in perimenopausal and postmenopausal women: a systematic review and meta-analysis. Menopause 2013.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/24149921/',
    finding:
      '10 trials in women around and after menopause. Walking alone had no significant effect on spine density. Hip (femoral neck) density rose only in programmes longer than 6 months.',
  },
  {
    id: 'berger2008',
    citation:
      'Berger et al. Change in bone mineral density as a function of age in women and men and association with the use of antiresorptive agents (CaMos). CMAJ 2008.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/18559803/',
    finding: 'In a Canadian cohort of 9,423, bone loss began at 25–39 in men and at 40–44 in women.',
  },
  {
    id: 'howe2011',
    citation:
      'Howe et al. Exercise for preventing and treating osteoporosis in postmenopausal women. Cochrane 2011.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/21735380/',
    finding:
      '43 trials in postmenopausal women. Leg resistance training raised femoral-neck density by 1.03 percentage points against controls; combined programmes raised spine density by 3.22.',
  },
  {
    id: 'mages2021',
    citation: 'Mages et al. Exercise effects on bone mineral density in men. Nutrients 2021.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/34959796/',
    finding:
      'In men, exercise had small positive effects at the spine and femoral neck (standardised mean differences 0.38 and 0.25).',
  },
  {
    id: 'katzman2010',
    citation:
      'Katzman et al. Age-related hyperkyphosis: its causes, consequences, and management. J Orthop Sports Phys Ther 2010.',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2907357/',
    finding:
      'A review (full text; the abstract gives no numbers). The upper-back curve begins to increase after 40. Back-extension protocols: 3 sets of 8, progressing the arms from the sides to a W to the fists by the ears; or 1 set of 10, 5 times a week, with a backpack loaded up to 30% of one-repetition maximum.',
  },
  {
    id: 'kado2004',
    citation:
      'Kado et al. Hyperkyphotic posture predicts mortality in older community-dwelling men and women. J Am Geriatr Soc 2004.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/15450042/',
    finding:
      '1,353 older adults, followed 4.2 years. Those with a hyperkyphotic posture died at a 1.44 times higher rate (1.40 after fuller adjustment).',
  },
  {
    id: 'kado2005',
    citation: 'Kado et al. Hyperkyphotic posture and poor physical functional ability. J Gerontol A 2005.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/15972617/',
    finding:
      '1,578 older adults. The odds of needing the arms to rise from a chair rose with the curve, to 3.7 for the most hunched.',
  },
  {
    id: 'sinaki2002',
    citation: 'Sinaki et al. Stronger back muscles reduce the incidence of vertebral fractures. Bone 2002.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/12052450/',
    finding:
      'Eight years after a two-year back-extension programme, 1.6% of vertebrae had fractured against 4.3% in controls (50 postmenopausal women).',
  },
  {
    id: 'sheaf2017',
    citation:
      'Katzman et al. Targeted spine strengthening exercise and posture training program to reduce hyperkyphosis in older adults (SHEAF). Osteoporos Int 2017.',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5873977/',
    finding:
      '99 adults of 60 or older with a curve of 40° or more (full text). Spine strengthening with posture training cut the curve by 3.0° against controls in 6 months; it rose 1.6° again in the 6 months after the programme ended.',
  },
]
