# 1 · App design

Tortoise is a phone app (a PWA, installed from the browser) that runs the [exercise plan](2-exercise-plan.md). It shows the
day's session, guides it with timers, records what was done, and keeps the tests and milestones for decades. Exercise
only: nutrition, sleep and medicine are out of scope.

**At a glance**

| | |
|---|---|
| Users | One person; the iPhone first (installed from Safari), and every other platform too: Android phones and desktop browsers install or run it the same way (D-047). A backup file moves the data between them |
| Address | <https://tortoise.doctornova.net> |
| Data | Only on the phone (IndexedDB), with export and import of a backup file |
| Network | None needed after the first load; only app updates use it. No account, no server, no analytics, no third-party requests |
| Language | English |

---

## 1. Principles

1. **The phone keeps the data.** Every log stays on the device; nothing is sent anywhere. Backups go only where the user
   saves them. (The owner prefers auditable first-party code for private data; this design needs no third party at all.)
2. **Offline first.** After the first load the app works with no network: in the basement, in airplane mode, on a trail.
3. **One tap per thing.** "Done as planned" is the default; editing reps or weights is optional. A normal day takes under
   ten taps to log.
4. **Forgiving streaks.** A 15-minute Shell day counts. The streak breaks only on two missed days in a row. Sick days pause
   it. ([§5.2](#52-day-status-and-the-tortoise-streak))
5. **The plan is data.** Sessions, ladders, tests and milestones live in one typed data file built from
   [2-exercise-plan.md](2-exercise-plan.md). Changing the plan means changing data, not screens.
6. **Show the why.** Every exercise shows one line of why. A tap opens the detail and its sources, and every number names
   a source in [sources.md](sources.md).
7. **iPhone first.** Designed within what Safari allows a home-screen web app ([§2](#2-the-iphone-as-a-platform)).
8. **No grey.** Titles, labels, captions and icons use the text colour or a theme colour; hierarchy comes from size, weight
   and colour. Grey is kept only for a disabled control (the owner's standing rule).
9. **Public code, private life.** The repo is public, so it holds no personal facts. Profile values (birth year, weight)
   exist only on the phone.

---

## 2. The iPhone as a platform

What a home-screen web app can and cannot do on iOS, and how the design copes. Each "verify" item is checked on the real
phone in Phase 8 of [3-implementation.md](3-implementation.md).

| Topic | Fact or constraint | Design |
|---|---|---|
| Install | Safari → Share → Add to Home Screen; it then opens full screen as its own app. Safari offers no install button and cannot tell a page that the app is installed | The first run's install card gives written directions in Safari ([§3.8](#38-first-run)); `display: standalone` |
| Offline | A service worker caches the app | Precache everything at install; no runtime requests |
| Storage | IndexedDB on the device. WebKit counts days of use separately for home-screen web apps, so daily use keeps the data. The home-screen app keeps its own data, apart from Safari's (verify) | Ask for persistent storage; a backup reminder every 30 days; export and import; the first run asks to install before starting ([§3.8](#38-first-run)) |
| The address is the data | Data belongs to the exact origin `https://tortoise.doctornova.net`; another address starts empty | The address was chosen once and never changes (decision D-010) |
| Sound | Web Audio starts only after a tap; the ring/silent switch may mute it (verify) | Unlock audio on the session's Start tap; every cue is also shown on screen |
| Speech | Safari's speech synthesis uses the phone's own voices and needs no network (verify in the home-screen app) | Spoken cues are optional; tones and text always carry the cue |
| Vibration | Safari has no Vibration API | Visual and sound cues only |
| Screen awake | Screen Wake Lock API in Safari; older iOS versions had it broken in home-screen mode (verify) | Keep the screen on whenever the app is open (D-050); if that fails, a notice in the player to set Auto-Lock |
| Background | iOS suspends a web app in the background; timers stop firing | Timers run from timestamps and catch up on return; cues need the screen on |
| Updates | An installed web app gets a new version only when its service worker updates | An update banner; Settings shows the app and plan versions |
| Health data | A web app cannot read Apple Health | Steps and run distance are typed in (optional) |
| Files | The Web Share API can share a file to Files or iCloud Drive | Backup export through the share sheet |

---

## 3. Screens

A bottom tab bar, within thumb reach, floating as a glass bar (D-048), holds five tabs: **Today · Week · Progress · Library · Settings**. The session player
and the test wizard open full screen above the tabs.

### 3.1 Today (home)

```
┌────────────────────────────────────────┐
│ Mon 23 Nov · Block 1 · Week 1          │  date, block, week (build / light / test)
│ 🐢 Tortoise streak 8 days              │
├────────────────────────────────────────┤
│ MORNING BLOCK                15 min  ✓ │  card: done in green
│ ◷ After waking                         │  when in the day (plan §4)
├────────────────────────────────────────┤
│ STRENGTH A                   35 min    │  card: main session, warm-up included
│ ◷ Lunch to mid-afternoon, 3–4 h after… │
│ Jumps · Squat L1 · Push L3 · Row ...   │  current levels
│ [ Start ]          [ Done as planned ] │
├────────────────────────────────────────┤
│ FRONT SPLIT BLOCK            10 min    │
│ ◷ Right after the main session, …      │
│ [ Start ]          [ Done as planned ] │
├────────────────────────────────────────┤
│ Short on time? [ Make it a Shell day ] │
└────────────────────────────────────────┘
```

- **Day ring** (top right, not drawn above): empty, shell or full, filling as cards are done.
- **Cards in the order of the day:** morning block, main session, split block. Each card shows when in the day
  it belongs (plan §4: after waking; lunch to mid-afternoon; right after the main session, in the same sitting, D-052),
  its time, its exercises with their current ladder levels, **Start** (opens the player) and **Done as planned** (one tap). The main
  card includes the session's warm-up.
- **Run days** (Tuesday, Thursday, Saturday): an **Outdoor ☀ / Indoor** switch picks the variant; it starts at Outdoor
  (D-053).
- **Sunday:** the split work is inside the Light session, so there is no split card; finishing the session records the
  split as well.
- **Light and test weeks** show a banner: "Light week: 2 sets, runs 30% shorter", "Test weekend: the Tortoise Test". On
  the two test days the main card is that day's part of the test, and there is no split card.
- **Make it a Shell day** folds the cards that are still open, so the day ends with the morning block. It only tidies
  the screen: the status still follows [§5.2](#52-day-status-and-the-tortoise-streak), and a tap unfolds the cards
  again.
- **Yesterday missed?** A banner offers "Log yesterday" (the honour system), or "It was a sick day" (pauses the streak).
- **Level-up suggestions** appear as a card when a ladder's pass rule is met: "Ready for Bulgarian split squat? Move up /
  Not yet".

### 3.2 Session player (full screen)

- One step at a time: the exercise name and level, the target (3 × 10, or 30 s), two lines of cue, and a big timer or set
  tracker.
- **Step kinds**

  | Kind | Behaviour |
  |---|---|
  | Reps | Tap each set; the rest timer starts on its own; +/− adjusts reps and weight |
  | Hold | A countdown per set, with "per side" handled automatically |
  | Interval | Work/rest cycles with a 3-2-1 countdown, start and end tones, and an optional spoken cue ("Easy, 60 seconds") |
  | Timed | A run or walk: elapsed time; run–walk steps cue each switch |
  | Stretch | A hold timer per position and side |

- **After each exercise:** "Too easy / Right / Too hard". Two "too hard" answers in a row suggest one level down; the pass
  rule suggests one level up. The morning block asks only after its ladder steps, the handstand and the one-leg stance
  (D-051).
- **No lock layer (D-050).** The screen stays on for as long as the app is open, and only the phone's side button locks
  it. There is no pocket lock: on an outdoor run a stray touch in a pocket can tap a button, which the owner accepted.
- **Summary at the end:** total time, sets, a 1–10 effort pick, and an optional note. Saving marks the card done.

### 3.3 Week

- Seven rows, Monday to Sunday: each shows the main session, the split block, and the day's status colour.
- The week's label: build, light or test.
- **Swap days:** pick two days of the week to swap their main sessions; each session takes its split block along. The
  app warns if the swap breaks a rule (two strength days in a row, intervals the day before the long run).
- Tapping a past day opens it for viewing or editing.

### 3.4 Progress

- **The Shell:** the year as a honeycomb of hexagons, one per day, coloured by status, two weeks to a row (D-041). Over
  a year it fills like a tortoise's shell. Tapping a hexagon opens that day.
- **Numbers:** the tortoise streak and the longest one; full days this month; Shell days; outdoor sessions; minutes per
  pillar (strength, aerobic, skills, mobility) this week against the plan.
- **Test trends:** a small line chart for every test of the Tortoise Test (the VO2max estimate for the Rockport walk),
  with the aim line where the test has one.
- **Levels over time:** a step chart per ladder.
- **Milestones:** earned badges with dates, and "next up" with progress bars.
- **The At-99 board:** each 99-year ability with its latest result ([plan §11](2-exercise-plan.md#11-milestones)).

### 3.5 Tortoise Test wizard

- Opens from Today on a test weekend, or from Progress at any time.
- Two parts, Day 1 (outdoors) and Day 2 (indoors), resumable across days.
- Each test card has its instructions, a built-in stopwatch where needed (the mile walk, the 15-second pulse count,
  one-leg stance capped at 60 s, hang, farmer hold, squat hold), and input fields.
- Built-in calculators:
  - sit-to-rise: two steppers counting down from 5;
  - Rockport: time, heart rate and weight give the VO2max estimate; age and sex come from the profile, or are asked
    here;
  - height: the change against the tallest earlier record.
- Height is asked once a year: when the last height record is 48 weeks old or more.
- In Week 0 the wizard also asks the three start questions (easy running, the rope, a slow negative pull-up).
- On saving: comparison with the last test; milestones awarded; and, in Week 0, the starting levels set by the rules in
  [plan §8](2-exercise-plan.md#8-the-first-13-weeks).

### 3.6 Library

- Search, plus filters by area (spine, strength, handstand, splits, cardio, playground) and "with video". The search
  and filters are kept in the address (`/library?q=…&area=…`), so going back from an exercise returns to the same list.
  A search needs every word in the name, the texts or a ladder level's name; name matches come first.
- **Exercise page** (`/library/<id>`): how to do it, the key cue, the common mistake; the why line with source chips (a
  chip opens the finding and its link); each ladder the exercise is on, with the current level marked and pass targets
  shown (another level can be set by hand, after a confirmation); the last 10 logs; and a video link where one exists
  (it opens outside the app, with the title, the channel and the day the link was checked).
- **Source page** (`/library/sources/<id>`): the citation, the finding, the link, and the exercises and ladders citing
  it.

### 3.7 Settings

| Section | Contents |
|---|---|
| Plan | Start date (the Monday of Week 1); "Restart from Week 0" on a chosen Monday (keeps history) |
| Profile (on this phone only) | Birth year, sex, weight and height: all optional, used only for HRmax, Rockport and the broad-jump aim |
| Units | kg or lb; km or mi. One card |
| Backup | Export, import, the last backup date, and the reminder interval (30 days by default; 7, 14, 60 or 90 to choose) |
| About | App version, plan version, the number of sources with a link to their list in the repo (opens outside the app), privacy statement, the runtime libraries' licences |
| Reset | Delete all data (type DELETE to confirm) |

### 3.8 First run

- **In a browser:** an install card that fits the browser (D-047), and always **Start in this browser instead**:
  - **Install Tortoise**, a button, where the browser offers its install prompt (Chrome, Edge, Samsung Internet, Opera);
  - "Tortoise is installed on this device" where the browser can tell (Chrome on Android; Chrome and Edge on desktop),
    with **Open Tortoise** on desktop, which opens the installed app, and on Android where the app is found;
  - written directions where there is no button: Share → Add to Home Screen on an iPhone or iPad (in any browser
    there), File → Add to Dock in Safari on a Mac, the menu in Firefox on Android, the address-bar button in Firefox on
    Windows, and the address bar or the menu in a Chromium browser that gave no prompt; then "Already installed? Open
    Tortoise from …", since these browsers cannot tell;
  - inside another app's browser, or in a browser that cannot install (Firefox on a Mac or Linux): the address, with a
    copy button, to open it elsewhere.
  - Apple's installed web apps keep their own data, apart from the browser's, so on an iPhone, iPad or Mac the plan is
    started in the installed app, not the tab. Chromium's installed app shares the browser's data.
- **In the installed app:** pick the Monday on which Week 0 begins: the coming Monday by default, or today on a
  Monday. Week 1 starts seven days later.
- **Until Week 0 begins:** Today shows the days left. The Library is open, and the morning block can be tried; days
  before Week 0 have no status and no streak.
- The profile is optional. The Rockport test asks for age, sex and weight when it needs them.
- A link leads to Settings → Backup, to restore a backup instead of starting afresh (a new phone, or the move from the
  Safari tab to the home-screen app).

---

## 4. Navigation map

```
First run ─ Install card → start Monday
Today ──┬─ Session player (full screen)
        ├─ Test wizard (full screen, on test weekends)
        └─ Day detail (yesterday / any past day)
Week ───── Day detail, swap days
Progress ┬ Shell → Day detail
         ├ Test trends → Test detail, test wizard
         ├ Milestones
         └ At-99 board
Library ── Exercise page → Source detail
Settings ─ Backup / Profile / About
```

---

## 5. Rules the app enforces

### 5.1 The plan calendar

- **Week 1** starts on the Monday chosen as the start date; **Week 0** is the seven days before it.
- **Block** = ceil(week ÷ 4). **Week in block** = ((week − 1) mod 4) + 1.
- **Light week:** week in block = 4. **Test week:** a light week whose block number is a multiple of 3, and Week 0.
- **Test days:** the Saturday and Sunday of a test week. The day's part of the Tortoise Test takes the place of the
  main session and the split block.
- **Week 0 changes:** half volume from Monday to Friday: sets halved (rounded up), run and rope minutes halved,
  interval reps halved (rounded up), and every ladder at level 1.
- **Ramp changes:** strength at 2 sets in Weeks 1 and 2.
- **Light-week changes:** strength sets −1 (never below 2); run and rope minutes × 0.7; interval reps halved, rounded up.
  The morning block and the splits are unchanged.
- **Interval stage:** Block 1 → stage 1, 2 → 2, 3 → 3, 4 onward → the 4 × 4 ([plan §6.7](2-exercise-plan.md#67-intervals--thursday)).
- **Swaps** live in a per-week override. They never change the template.

### 5.2 Day status and the tortoise streak

| Status | Rule | Colour | Mark |
|---|---|---|---|
| Full | Morning block and main session both done | Moss green | Filled |
| Shell | One of the two done. The morning block alone is the planned Shell day; the main session alone counts the same | Shell amber | Half filled |
| Missed | Neither done, once the day is over | Brick | Outline |
| Paused | Marked sick or injured, with neither done | Sky | Dashed outline |
| Ahead | A future day, or today while nothing is done yet | Pale beige | Faint fill |

- A day with something done is Full or Shell even when it is marked sick: done beats paused.
- On a test day, the day's part of the Tortoise Test counts as the main session. On Sunday the Light session is the
  main session.
- The split block does not change the status; it feeds its own counts and milestones.
- **Tortoise streak:** the number of done days, Full or Shell, in the current run.
  - Count back from today, or from yesterday while today has nothing done.
  - One missed day does not end the run, but adds nothing to the count. Two missed days in a row end it.
  - Paused days are skipped: they add nothing, end nothing, and do not come between two missed days.
  - The run never reaches back before Week 0.
- **Longest streak:** the largest such count in the history.

### 5.3 Progression suggestions

- **Reps:** all sets at the top of the range, logged "Right" or "Too easy", in two sessions in a row → suggest the next
  level.
- **Holds:** all sets at the target → suggest the next level.
- **Two "Too hard" in a row** → suggest one level down.
- **After 14 or more days with no logs for a ladder** → suggest one level down for a week.
- **Endurance steps** (run–walk, rope) move only on the user's tap, at least 7 days apart. Past the ladders, the run
  cards show last week's minutes and the most that the 10% rule allows this week.
- **By hand:** a level can be set from the Library at any time, for a start above level 1 or a step back after an
  injury.
- The app never changes a level by itself: the user confirms each move, and the history keeps every change with its date.

---

## 6. Data model (IndexedDB database `tortoise`)

| Store | Key | Fields |
|---|---|---|
| `settings` | `"settings"` | startDate; profile {birthYear, sex, weightKg, heightCm} (all optional); units {mass, distance}; backup {lastAt, everyDays}. Records from before D-053 also held dumbbellKg, location, runDefault and reminders; they are dropped when read |
| `days` | `YYYY-MM-DD` | paused (sick, injured or none); morning {doneAt, items}; main {doneAt, sessionId, variant (outdoor or indoor), minutes, distanceKm, effort 1–10, note, asPlanned (a one-tap "Done as planned")}; split {doneAt, kind (front, side, both or long)}; folded (the "Make it a Shell day" tap) |
| `logs` | a random id, unique across devices; indexes on date and on ladder | date, sessionId, exerciseId, ladderId, level, sets [{reps, seconds, kg}], feedback (easy, right or hard) |
| `levels` | ladderId | level, since, history [{level, date}] |
| `tests` | date of Day 1 | results {rockport {minutes, heartRate, weightKg}, broadJumpCm, hangS, farmerS, heightCm, wallCm, sitRise {sit, rise}, oneLeg {openL, openR, closedL, closedR}, pushups, squatHoldS, splits {frontL, frontR, side}, handstand {wallS, freeS}, restingHr}; start answers {runMin, ropeMin, negative} (Week 0 only); computed {vo2max, sitRiseScore} |
| `overrides` | Monday of the week | swaps [[day, day]] |
| `milestones` | milestoneId | earnedAt |
| `photos` | a random id; index on date | date, dataUrl (a JPEG of at most 1280 px), note (optional); added by migration 2 (D-044) |
| `meta` | `"meta"` | schemaVersion, createdAt, appVersion |

- Every record carries `updatedAt`. It decides which record is newer when a backup is merged
  ([§10](#10-backup-and-restore)), and a log's random id keeps two phones from giving different logs the same key.
- Volume: one `days` record a day for 60 years is about 22,000 small records. IndexedDB handles that easily.
- Schema changes go through numbered migrations, each covered by a test with a fixture of the previous version.

---

## 7. Plan content model (static, shipped with the app)

One typed data module, validated by a schema in the tests and at start-up:

| Part | Holds |
|---|---|
| sources | id, citation, url, finding: mirrors [sources.md](sources.md) |
| exercises | id, name, area, how, cue, mistake, why (required), sources, video link (optional: url, title, channel, the day it was checked), unit (reps, seconds or minutes) |
| ladders | id, name, levels [{level, exerciseId, target (sets × reps or seconds, per side), pass rule}] |
| sessions | id, kind (morning, strength, run, intervals, long, light, split), minutes (in total and per pillar), steps [{ladderId or exerciseId, sets, reps / seconds / minutes, rest, paired with}], variants {outdoor, indoor}. A main session's steps begin with its warm-up |
| week template | Monday–Sunday → {morning, main, split (none on Sunday)} |
| block rules | block length, light week, test cadence and test days, Week 0 and ramp changes, light-week changes, interval stages |
| tests | id, name, how, unit, aim, sources, day (1 or 2), order, calculator (rockport, sitRise, height or none) |
| milestones | id, name, kind (streak, count, test or level), metric, threshold |
| start rules | Week 0 results and start answers → starting levels |
| At-99 board | ability, measure (a test or a log metric), line |
| plan version | a date, shown in About and written into every backup |

**Content rules, enforced by tests:**
- Every id is unique, and every reference resolves.
- Any text holding a digit names a source, or carries the "our rule" flag.
- Every source is used.
- The minutes per day match the ranges in the exercise plan.

---

## 8. Calculations

| What | Formula | Source |
|---|---|---|
| HRmax | 208 − 0.7 × age | [tanaka2001] |
| Easy ceiling / hard band | ≤ 0.70 × HRmax; 0.90–0.95 × HRmax | [helgerud2007] |
| Rockport VO2max | L/min = 6.9652 + 0.0091 × weight (lb) − 0.0257 × age + 0.5955 × sex (1 male, 0 female) − 0.2240 × time (min) − 0.0115 × heart rate. mL/kg/min = 1000 × L/min ÷ weight (kg). Flag ages outside 30–69 | [kline1987] |
| Sit-to-rise | (5 − supports sitting) + (5 − supports rising), each part at least 0 | [brito2014] |
| Height loss | The tallest earlier record − today's height; flag more than 2 cm | [oc2023] |
| Units | 1 kg = 2.20462 lb; 1 km = 0.621371 mi | — |
| Pillar minutes | Four pillars: strength, aerobic, skills, mobility. Planned: each session template's minutes per pillar. Done: the logged minutes in the template's shares, or the template's own minutes for a "Done as planned" | — |

---

## 9. Reminders

None since D-053: the owner removed the calendar-file reminders, and a web app has no push notifications without a push
server (D-013). The Today cards say when in the day each part belongs (plan §4).

---

## 10. Backup and restore

- **Export:** one JSON file, `tortoise-backup-YYYY-MM-DD.json`, holding a format tag and version, the export time, the app
  version, and every store. It goes out through the share sheet (Files, iCloud Drive, AirDrop to the Mac), with a plain
  download as the fallback.
- **Import:** pick a file → schema validation → migrate from older versions → a preview (record counts and date range) →
  **Merge** (for each key the record with the later `updatedAt` wins) or **Replace** → written in one transaction.
- **Validation:** a file that is not JSON, not a Tortoise backup, damaged (the message names the store, record and
  field) or from a newer version of the app is refused with its own message, and nothing is written. The file also
  carries the database schema version, so a future migration can upgrade an old file's records.
- **The backup date** is written into the file's own settings record, and the phone saves the same record once the
  file has gone out, so the phone and the file hold identical data (D-042).
- **Reminder:** a banner on Today when the last backup is 30 days old or more (the interval is set in Settings); before
  the first backup it counts from the Week 0 Monday. "Not today" hides it until the app is opened again.
- A backup file is personal data. It goes wherever the user sends it, never into the repo.

---

## 11. Privacy and security

- A Content Security Policy allows only the app's own origin: `default-src 'self'`; `connect-src 'self'`;
  `img-src 'self' data: blob:`. No third-party scripts, fonts, analytics or cookies.
- External links (videos, sources) open in the browser, outside the app.
- The repo holds no personal facts; a test scans committed text for banned personal terms. The list itself is
  committed only as keyed hashes ([3-implementation.md](3-implementation.md), §3 and Phase 0).

---

## 12. Visual design

**Theme tokens** (light / dark; never grey for text or icons):

| Token | Light | Dark | Use |
|---|---|---|---|
| background | `#FBF7EE` (cream) | `#0F1A12` (deep forest) | Page |
| surface | `#FFFFFF` | `#17251A` | Cards |
| text | `#1E2B1E` | `#F3ECDA` | All text, at full strength |
| primary | `#3E6B3F` (moss) | `#7FB77E` | Full days, buttons, headings |
| primary-strong | `#2E5230` | `#A6D3A3` | Secondary text, in place of grey |
| shell | `#9A6212` (amber) | `#E0A955` | Shell days, streaks |
| sky | `#2A72AB` | `#6DB3E8` | Outdoor, daylight, paused days |
| brick | `#B23A2A` | `#E07A6A` | Missed days, warnings, delete |
| line | `#E4DCC8` (beige) | `#2C3B2E` | Borders, dividers, days ahead |

- **Contrast:** text, primary, primary-strong, shell, sky and brick each reach 4.5:1 or more on both the background and
  the surface, in both themes (computed with the WCAG formula).
- **Type:** the system font (SF Pro on iPhone), so nothing has to load. Timers are 64–96 px; headings 22–28 px semibold.
- **Icon:** a geometric tortoise whose shell is made of hexagons, matching the Shell calendar. App icons at 192 and
  512 px, a maskable version, and the 180 px Apple touch icon.
- **Layout:** one column; safe-area insets for the notch and the home indicator; tap targets of 44 pt or more.
- **Motion:** small and short; none when the system asks for reduced motion.

**Glass and the backdrop (D-048):**

- **Panels are glass:** cards, banners, the tab bar, the player's panel and fields are translucent, with a blur of what
  lies behind them, a bright top edge and a soft shadow tinted with the text colour. `surface` stays the solid panel
  colour, used when the phone asks for reduced transparency.
- **The backdrop:** the page colour with four soft colour fields (moss, sky, amber and a light) that drift to and fro over
  80 to 131 seconds each. They are pale in the light theme and deep in the dark, so that text, primary, primary-strong,
  shell, sky and brick keep 4.5:1 on the page and on every panel, over any overlap of the fields (the contrast guard
  computes every case).
- **Small motion:** the tab bar's pill glides to the open tab; a screen settles in with a short lift; buttons press in;
  the day ring's arc glides to its new length; the big timer glows softly.
- **Still:** reduced motion stops the drift. There is no switch in Settings and no raindrops since D-053.

---

## 13. Accessibility

- Contrast of 4.5:1 or more for text, in both themes.
- Every control has a label; timers announce changes to VoiceOver.
- Layouts hold up with larger text.
- Less transparency asked for: the glass panels turn solid (D-048).
- Colour is never the only signal: every day status has its own mark as well as its colour
  ([§5.2](#52-day-status-and-the-tortoise-streak)), and the ring shows a count.

---

## 14. Out of scope, and later

| Not in the app | Why |
|---|---|
| Nutrition, sleep, medicine | The owner's scope: exercise only (D-001) |
| Accounts, cloud sync, sharing | Private, on-device design (D-012) |
| Push notifications | Would need a server (D-013) |
| Apple Health, GPS tracking | Not available to a web app (Health), or a battery drain with no background mode (GPS) |

| Later, optional | Condition |
|---|---|
| Weather hint for outdoor days | Only from an official source that browsers can call (Environment and Climate Change Canada), with a city-level location the user sets; off by default (D-020) |
| Progress photos (posture, splits) | Stored on the phone only; can be left out of backups |
| Spoken coaching for whole sessions | If the cues prove useful |
