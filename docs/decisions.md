# Decisions

Every choice in the Tortoise plan, with who made it and why. New entries take the next number.

**Who decided:**
- *Owner* means the owner chose it: in their own words, or in a picker.
- *Builder's ruling* means the building session decided it as a construction choice (under the owner's delegation, where
  that is noted). The owner may overturn any builder's ruling.

**Next number: D-029**

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
| D-004 | **Outdoor running in good weather; the rope indoors.** The rope was first meant to replace running; the owner then asked for outdoor running for the sun | Owner ("natural sun is important, so we can encourage outdoor running on a good weather") | 2026-11-21 | Running has strong survival evidence [lee2014, pedisic2020], and the owner wants daylight. Note: winter sun at these latitudes makes no vitamin D [webb1988] |
| D-005 | **Playground or park bars** for hanging and pull-ups on outdoor days; dumbbell rows otherwise. No pull-up bar is bought | Owner (picker; the recommended option was to buy a bar) | 2026-11-21 | The owner's choice. Cost: less regular hanging in winter, so dead-hang progress is slower |
| D-006 | **One fixed pair of medium/heavy dumbbells (7–15 kg each).** Progress comes from one-leg variants, tempo and a loaded backpack | Owner (picker, a fact) | 2026-11-21 | A fixed load needs harder variants rather than more kilograms; a backpack of water bottles adds load in 1-kg steps (1 litre = 1 kg) |
| D-007 | **The shape of a day:** a 15-minute morning block after waking, plus a main session of about 45 minutes at lunch or in the evening | Owner (picker, recommended option) | 2026-11-21 | The skills grow with frequency; lunch runs catch winter daylight |
| D-008 | **The weekend:** Saturday is the long outdoor session plus the playground; Sunday is light | Owner (picker, recommended option) | 2026-11-21 | The owner's schedule |
| D-009 | **Daily load:** about 60 min on weekdays, 1.5–2 h on Saturday and about 45 min on Sunday, about 7 hours in a full week; about 4–5 hours in the ramp-up weeks; a 15-minute Shell day counts | Builder's ruling, under the owner's delegation ("you arrange the daily intensity"; "I have time") | 2026-11-21 | Three skill goals need daily practice on top of the longevity pillars; the Shell day protects the habit on hard days |
| D-015 | **The cycle:** 4-week blocks (3 building weeks, 1 light week); the Tortoise Test in Week 0 and then every 12 weeks, in the light week | Builder's ruling | 2026-11-21 | Planned recovery; testing when rested; 4 tests a year line up with calendar quarters |
| D-027 | **Splits by static holds** of about 60 s, at least 5 days a week for each split, plus strength through full range | Builder's ruling | 2026-11-21 | Static stretching gave larger gains than ballistic or PNF methods, and weekly frequency mattered [thomas2018]; strength training improved range as much as stretching [afonso2021] |
| D-028 | **Intervals:** a 3-block ramp (30/60 s → 1/1 min → 2/2 min), then the Norwegian 4 × 4 from Block 4 | Builder's ruling | 2026-11-21 | The 4 × 4 raised VO2max 7.2% in 8 weeks [helgerud2007]; the ramp lets calves, Achilles tendons and rope skill catch up |

## The app

| D | Decision | By | Date | Why |
|---|---|---|---|---|
| D-010 | **The address is `https://tortoise.doctornova.net`, chosen once** | Owner (picker, recommended option) | 2026-11-21 | The phone keeps the data per address, so changing it would leave the data behind. Its own subdomain walls the data off from the owner's other sites, and the host can change without changing the address |
| D-011 | **iPhone** is the target phone | Owner (picker) | 2026-11-21 | The design works within Safari's limits for home-screen web apps |
| D-012 | **Local-first:** all data on the phone (IndexedDB); no account, server, analytics or third-party requests; export and import of a backup file | Builder's ruling | 2026-11-21 | The owner prefers auditable first-party code for private data; nothing in the app needs a server |
| D-013 | **Reminders by calendar file** (iCalendar, weekly events with alarms) instead of push notifications | Builder's ruling | 2026-11-21 | Web Push needs a push server; the phone's own Calendar rings even when the app is closed |
| D-014 | **The streak:** a Shell day counts; the tortoise streak breaks only on two missed days in a row; sick days pause it | Builder's ruling | 2026-11-21 | Over 60 years a single bad day must not reset the habit; "never miss twice" |
| D-018 | **The plan is typed data with enforced source rules:** every id resolves, every digit names a source or is flagged "our rule", and every source is used | Builder's ruling | 2026-11-21 | The same rule as the Straight Back page; the app cannot drift from the evidence |
| D-020 | **No weather in v1.** Later, only from an official source that browsers can call, city-level, off by default. Daylight times are computed on the phone | Builder's ruling | 2026-11-21 | No third-party requests; daylight needs no network |
| D-024 | **No grey** for titles, labels, captions or icons; grey only for disabled controls | Owner (standing rule) | 2026-11-21 | The owner's rule for every UI |
| D-025 | **Units:** kg and km by default; lb and mi in Settings | Builder's ruling | 2026-11-21 | Metric Canada; dumbbells are often labelled in pounds |
| D-026 | **Videos are links, never embeds;** health bodies first | Builder's ruling | 2026-11-21 | The Content Security Policy allows no third-party content inside the app |

## Building and the repo

| D | Decision | By | Date | Why |
|---|---|---|---|---|
| D-016 | **Stack:** TypeScript, React 19, Vite 8, Tailwind 4, TanStack Router, zod 4, lucide-react, Biome, Vitest 4, Playwright (WebKit), pnpm, GitHub Pages | Builder's ruling | 2026-11-21 | The owner's existing frontend stack, minus what an offline single-user app does not need (no server-state or mocking libraries) |
| D-017 | **A first-party service worker,** with its precache list written at build by a small Vite plugin; no Workbox | Builder's ruling | 2026-11-21 | Auditable, and small enough to read in full |
| D-019 | **Hand-made SVG charts;** no chart library | Builder's ruling | 2026-11-21 | A few small charts; fewer dependencies |
| D-022 | **Public repo, private life:** no personal facts in any committed file, including `ai/` and commit messages. Profile values live only on the phone. A guard test bans personal terms | Builder's ruling | 2026-11-21 | The repo is public; the owner's household facts never go on a public site |
| D-023 | **English** for the UI and for everything committed | Owner (global rule) | 2026-11-21 | The owner's rule for all repos |
