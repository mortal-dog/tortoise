# Decisions

Every choice in the Tortoise plan, with who made it and why. New entries take the next number.

**Who decided:**
- *Owner* means the owner chose it: in their own words, or in a picker.
- *Builder's ruling* means the building session decided it as a construction choice (under the owner's delegation, where
  that is noted). The owner may overturn any builder's ruling.

**Next number: D-036**

---

## Scope and goals

| D | Decision | By | Date | Why |
|---|---|---|---|---|
| D-001 | **Exercise only.** The app tracks exercise; no nutrition, sleep or medicine | Owner ("this app only do exercise monitor, no nutrition monitor") | 2026-11-21 | A focused app; longevity nutrition is acknowledged but out of scope |
| D-002 | **Goals:** at 99, a straight back and still able to jump and run. On the way: a handstand and both splits (side and front) | Owner | 2026-11-21 | The owner's goals; the handstand and the splits were added the same evening |
| D-021 | **No code until the owner starts Phase 0.** Every plan document and all non-code groundwork comes first | Owner ("don't write any code; write all the plan documents first; prepare everything except code") | 2026-11-21 | Plan before building |

## Equipment and training

| D | Decision | By | Date | Why |
|---|---|---|---|---|
| D-003 | **No-equipment focus**, with the dumbbells and jump rope already at home; nothing to buy | Owner | 2026-11-21 | The owner's constraint |
| D-004 | **Outdoor running in good weather; the rope indoors.** The rope was first meant to replace running; the owner then asked for outdoor running for the sun | Owner ("natural sun is important, so we can encourage outdoor running on a good weather") | 2026-11-21 | Running has strong survival evidence [lee2014, pedisic2020], and the owner wants daylight. Note: winter sun at 42° N and further north makes no vitamin D [webb1988] |
| D-005 | **Playground or park bars** for hanging and pull-ups on outdoor days; dumbbell rows otherwise. No pull-up bar is bought | Owner (picker; the recommended option was to buy a bar) | 2026-11-21 | The owner's choice. Cost: less regular hanging in winter, so dead-hang progress is slower |
| D-006 | **One fixed pair of medium/heavy dumbbells (7–15 kg each).** Progress comes from one-leg variants, tempo and a loaded backpack | Owner (picker, a fact) | 2026-11-21 | A fixed load needs harder variants rather than more kilograms; a backpack of water bottles adds load in 1-kg steps (1 litre = 1 kg) |
| D-007 | **The shape of a day:** a 15-minute morning block after waking, plus a main session of about 45 minutes at lunch or in the evening | Owner (picker, recommended option) | 2026-11-21 | The skills grow with frequency; lunch runs catch winter daylight |
| D-008 | **The weekend:** Saturday is the long outdoor session plus the playground; Sunday is light | Owner (picker, recommended option) | 2026-11-21 | The owner's schedule |
| D-009 | **Daily load:** about 60 min on strength days and 55–70 on run and interval days, 1.5–2 h on Saturday, and about 45 min plus a walk on Sunday. That is about 7½ hours in a full week, and about 8 with the longest Saturday run; about 5½ hours in Week 0 and about 6½ in the ramp-up weeks. A 15-minute Shell day counts | Builder's ruling, under the owner's delegation ("you arrange the daily intensity"; "I have time") | 2026-11-21 | Three skill goals need daily practice on top of the longevity pillars; the Shell day protects the habit on hard days. The hours were recounted in the review of 2026-11-21: the first summary said about 7 hours, and 4–5 in the ramp-up weeks, and the sessions' own minutes did not add up to either |
| D-015 | **The cycle:** 4-week blocks (3 building weeks, 1 light week); the Tortoise Test in Week 0 and then every 12 weeks, in the light week | Builder's ruling | 2026-11-21 | Planned recovery; testing when rested; about 4 tests a year |
| D-027 | **Splits by static holds** of about 60 s, at least 5 days a week for each split, plus strength through full range | Builder's ruling | 2026-11-21 | Static stretching gave larger gains than ballistic or PNF methods, and weekly frequency mattered [thomas2018]; strength training improved range as much as stretching [afonso2021] |
| D-028 | **Intervals:** a 3-block ramp (30/60 s → 1/1 min → 2/2 min), then the Norwegian 4 × 4 from Block 4 | Builder's ruling | 2026-11-21 | The 4 × 4 raised VO2max 7.2% in 8 weeks [helgerud2007]; the ramp lets calves, Achilles tendons and rope skill catch up |
| D-030 | **Week 0 and test weekends:** in Week 0 the sessions run at half volume with every ladder at level 1. On a test weekend the two test days take the place of Saturday's and Sunday's main sessions and split blocks. Three start questions (easy running, the rope, a slow negative pull-up) set the levels the tests cannot | Builder's ruling | 2026-11-21 | The first plan did not say what happens to the weekend sessions when a test is due, left "half volume" undefined, and based start levels on facts the test never recorded |
| D-031 | **Plan repairs from the review:** (1) the 10% rule applies beyond the run–walk and rope ladders, which move one step at a time, and rope step J6 grows by 10% a week instead of doubling; (2) indoor fallbacks: Tuesday follows the rope ladder, and Saturday uses Tuesday's indoor session plus the home pulling work; (3) the core ladder ends at the L-sit, and hanging raises stay at the playground; (4) Sunday's walk comes before the flexibility session; (5) the split blocks get a defined short form and long form; (6) the farmer hold moves to test Day 2; (7) the 100-day milestone is "Adult", not "Shell"; (8) the exercise library covers every exercise that the sessions and ladders name | Builder's ruling, under the owner's delegation for the daily load (D-009) | 2026-11-21 | Each one closes a contradiction inside the first plan: ladder steps that broke its own 10% rule; a fallback that asked a rope beginner for 24 minutes of rope; a home ladder that needed the bar the owner chose not to buy (D-005); stretching cold against its own safety rule; "short" and "long" forms never described; a dumbbell test listed outdoors; three different things called Shell; exercises with no library entry |

## The app

| D | Decision | By | Date | Why |
|---|---|---|---|---|
| D-010 | **The address is `https://tortoise.doctornova.net`, chosen once** | Owner (picker, recommended option) | 2026-11-21 | The phone keeps the data per address, so changing it would leave the data behind. Its own subdomain walls the data off from the owner's other sites, and the host can change without changing the address |
| D-011 | **iPhone** is the target phone | Owner (picker) | 2026-11-21 | The design works within Safari's limits for home-screen web apps |
| D-012 | **Local-first:** all data on the phone (IndexedDB); no account, server, analytics or third-party requests; export and import of a backup file | Builder's ruling | 2026-11-21 | The owner prefers auditable first-party code for private data; nothing in the app needs a server |
| D-013 | **Reminders by calendar file** (iCalendar, weekly events with alarms) instead of push notifications | Builder's ruling | 2026-11-21 | Web Push needs a push server; the phone's own Calendar rings even when the app is closed |
| D-014 | **The streak:** a Shell day counts; the tortoise streak breaks only on two missed days in a row; sick days pause it | Builder's ruling | 2026-11-21 | Over 60 years a single bad day must not reset the habit; "never miss twice". D-029 completes the rules |
| D-018 | **The plan is typed data with enforced source rules:** every id resolves, every digit names a source or is flagged "our rule", and every source is used | Builder's ruling | 2026-11-21 | The same rule as the Straight Back page; the app cannot drift from the evidence |
| D-020 | **No weather in v1.** Later, only from an official source that browsers can call, city-level, off by default. Daylight times are computed on the phone | Builder's ruling | 2026-11-21 | No third-party requests; daylight needs no network |
| D-024 | **No grey** for titles, labels, captions or icons; grey only for disabled controls | Owner (standing rule) | 2026-11-21 | The owner's rule for every UI |
| D-025 | **Units:** kg and km by default; lb and mi in Settings | Builder's ruling | 2026-11-21 | Metric Canada; dumbbells are often labelled in pounds |
| D-026 | **Videos are links, never embeds;** health bodies first | Builder's ruling | 2026-11-21 | The Content Security Policy allows no third-party content inside the app |
| D-029 | **Day status and the streak, completed** (refines D-014): either part alone, the morning block or the main session, makes a Shell day; a day with something done is never Paused; the streak number counts done days, one missed day is bridged without counting, and paused days are skipped; on test days the test part stands in for the main session | Builder's ruling | 2026-11-21 | The first wording gave no status to a day with only the main session, and did not say what the streak number counts |
| D-032 | **Backups merge by stable keys:** every record carries `updatedAt`, and logs get random ids instead of auto-increment ids | Builder's ruling | 2026-11-21 | With auto-increment ids two phones give different logs the same key, so "the newer record wins for each key" would silently drop one of them |
| D-033 | **Statuses differ by shape as well as colour** (filled, half filled, outline, dashed outline, faint), and the light theme's amber and sky are darkened to `#9A6212` and `#2A72AB` | Builder's ruling | 2026-11-21 | The design's own accessibility rules. Full and Shell differed by colour alone, and the first amber and sky reached only 3.4:1 and 4.3:1 on the page colour, under the 4.5:1 the design asks for |

## Building and the repo

| D | Decision | By | Date | Why |
|---|---|---|---|---|
| D-016 | **Stack:** TypeScript, React 19, Vite 8, Tailwind 4, TanStack Router, zod 4, lucide-react, Biome, Vitest 4, Playwright (WebKit), pnpm, GitHub Pages | Builder's ruling | 2026-11-21 | The owner's existing frontend stack, minus what an offline single-user app does not need (no server-state or mocking libraries) |
| D-017 | **A first-party service worker,** with its precache list written at build by a small Vite plugin; no Workbox | Builder's ruling | 2026-11-21 | Auditable, and small enough to read in full |
| D-019 | **Hand-made SVG charts;** no chart library | Builder's ruling | 2026-11-21 | A few small charts; fewer dependencies |
| D-022 | **Public repo, private life:** no personal facts in any committed file, including `ai/` and commit messages. Profile values live only on the phone. A guard test bans personal terms (its list: D-034) | Builder's ruling | 2026-11-21 | The repo is public; the owner's household facts never go on a public site |
| D-023 | **English** for the UI and for everything committed | Owner (global rule) | 2026-11-21 | The owner's rule for all repos |
| D-034 | **The personal-term guard keeps its list as keyed hashes** (HMAC-SHA-256). The key stays outside the repo, in an untracked local file and a CI secret (refines D-022) | Builder's ruling | 2026-11-21 | A public repo cannot hold the list in plain text, and a plain hash of a city or a first name falls to a dictionary attack |
| D-035 | **Phase 8 order:** verify the domain, then claim it in the repo's Pages settings, and only then add the DNS record | Builder's ruling | 2026-11-21 | GitHub's documentation: a DNS record that exists before a site has claimed the name lets someone else's site claim it. The first plan put the DNS record first |
