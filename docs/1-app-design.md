# 1 · App design

Tortoise is a phone app (a PWA, installed from the browser) that runs the [exercise plan](2-exercise-plan.md). It shows the
day's session, guides it with timers, records what was done, and keeps the tests and milestones for decades. Exercise
only: nutrition, sleep and medicine are out of scope.

**At a glance**

| | |
|---|---|
| Users | One person, on an iPhone (installed from Safari); a Mac browser for backups and viewing |
| Address | <https://tortoise.doctornova.net> |
| Data | Only on the phone (IndexedDB), with export and import of a backup file |
| Network | None after the first load: no account, no server, no analytics, no third-party requests |
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
| Install | Safari → Share → Add to Home Screen; it then opens full screen as its own app | An install hint on first visit in Safari; `display: standalone` |
| Offline | A service worker caches the app | Precache everything at install; no runtime requests |
| Storage | IndexedDB on the device. WebKit counts days of use separately for home-screen web apps, so daily use keeps the data | Ask for persistent storage; a backup reminder every 30 days; export and import |
| The address is the data | Data belongs to the exact origin `https://tortoise.doctornova.net`; another address starts empty | The address was chosen once and never changes (decision D-010) |
| Sound | Web Audio starts only after a tap; the ring/silent switch may mute it (verify) | Unlock audio on the session's Start tap; every cue is also shown on screen |
| Vibration | Safari has no Vibration API | Visual and sound cues only |
| Screen awake | Screen Wake Lock API in Safari; older iOS versions had it broken in home-screen mode (verify) | Keep the screen on during sessions; if that fails, a notice to set Auto-Lock |
| Background | iOS suspends a web app in the background; timers stop firing | Timers run from timestamps and catch up on return; cues need the screen on |
| Notifications | Web Push needs a push server | No push in v1; a calendar file sets the reminders ([§9](#9-reminders)) |
| Health data | A web app cannot read Apple Health | Steps and run distance are typed in (optional) |
| Files | The Web Share API can share a file to Files or iCloud Drive | Backup export through the share sheet |

---

## 3. Screens

A bottom tab bar, within thumb reach, holds five tabs: **Today · Week · Progress · Library · Settings**. The session player
and the test wizard open full screen above the tabs.

### 3.1 Today (home)

```
┌──────────────────────────────────────┐
│ Mon 23 Nov · Block 1 · Week 1        │  date, block, week (build / light / test)
│ 🐢 Tortoise streak 12 days           │
│ ☀ 07:24 – 16:37 · 9 h 13 min of day  │  daylight strip (once a location is set)
├──────────────────────────────────────┤
│ MORNING BLOCK              15 min  ✓ │  card: done in green
├──────────────────────────────────────┤
│ STRENGTH A                 30 min    │  card: main session
│ Jumps · Squat L1 · Push L3 · Row ... │  current levels
│ [ Start ]          [ Done as planned ]│
├──────────────────────────────────────┤
│ FRONT SPLIT BLOCK          10 min    │
│ [ Start ]          [ Done ]          │
├──────────────────────────────────────┤
│ HABITS  Steps [ 8,412 ]  Snacks ●●○  │
│         Outdoors [ 25 ] min          │
├──────────────────────────────────────┤
│ Short on time?  [ Make it a Shell day ]│
└──────────────────────────────────────┘
```

- **Day ring** (top right, not drawn above): three states, missed / shell / full, filling as cards are done.
- **Cards in the order of the day:** morning block, main session, split block, habits. Each card shows its time, its
  exercises with their current ladder levels, **Start** (opens the player) and **Done as planned** (one tap).
- **Run days:** an **Outdoor ☀ / Indoor** switch picks the variant; the default comes from Settings.
- **Light and test weeks** show a banner: "Light week: 2 sets, runs 30% shorter", "Test weekend: the Tortoise Test".
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
  rule suggests one level up.
- **Pocket lock** for outdoor runs: the screen stays on and touch is locked until a long press, so the phone can ride in a
  pocket without stray taps.
- **Summary at the end:** total time, sets, a 1–10 effort pick, and an optional note. Saving marks the card done.

### 3.3 Week

- Seven rows, Monday to Sunday: each shows the main session, the split block, and the day's status colour.
- The week's label: build, light or test.
- **Swap days:** pick two days to swap their main sessions within the week. The app warns if the swap breaks a rule
  (two strength days in a row, intervals the day before the long run).
- Tapping a past day opens it for viewing or editing.

### 3.4 Progress

- **The Shell:** the year as a honeycomb of hexagons, one per day, coloured by status. Over a year it fills like a
  tortoise's shell. Tapping a hexagon opens that day.
- **Numbers:** the tortoise streak and the longest one; full days this month; Shell days; outdoor sessions; minutes per
  pillar (strength, aerobic, skills, mobility) this week against the plan.
- **Test trends:** a small line chart per test (push-ups, broad jump, VO2max estimate, split distances, handstand holds,
  wall gap, dead hang, one-leg stance), each with its aim line.
- **Levels over time:** a step chart per ladder.
- **Milestones:** earned badges with dates, and "next up" with progress bars.
- **The At-99 board:** each 99-year ability with its latest result ([plan §11](2-exercise-plan.md#11-milestones)).

### 3.5 Tortoise Test wizard

- Opens from Today on a test weekend, or from Progress at any time.
- Two parts, Day 1 (outdoors) and Day 2 (indoors), resumable across days.
- Each test card has its instructions, a built-in stopwatch where needed (one-leg stance capped at 60 s, hang, farmer hold,
  squat hold), and input fields.
- Built-in calculators: sit-to-rise (two steppers counting down from 5), Rockport (time, heart rate and weight give the
  VO2max estimate), and height change against the last record.
- On saving: comparison with the last test; milestones awarded; and, in Week 0, the starting levels set by the rules in
  [plan §8](2-exercise-plan.md#8-the-first-13-weeks).

### 3.6 Library

- Search, plus filters by area (spine, strength, handstand, splits, cardio, playground).
- **Exercise page:** how to do it, the key cue, the common mistake; the why line with source chips (a chip opens the
  finding and its link); the ladder, with the current level marked and pass targets shown; the last 10 logs; and a video
  link where one exists (it opens outside the app).

### 3.7 Settings

| Section | Contents |
|---|---|
| Plan | Start date (the Monday of Week 1); "Restart from Week 0" (keeps history) |
| Profile (on this phone only) | Birth year, sex, weight and height: all optional, used only for HRmax, Rockport and the broad-jump aim |
| Units | kg or lb; km or mi |
| Equipment | Dumbbell weight (each) |
| Daylight | Location as latitude/longitude, typed in or "Use my location once". Stored on the phone; no network. Off until set |
| Runs | Default variant: outdoor, indoor, or ask each time |
| Reminders | Times for the morning block and the main session, then "Add to Calendar" ([§9](#9-reminders)) |
| Backup | Export, import, the last backup date, and the reminder interval (30 days) |
| Storage | Whether storage is persistent; space used |
| About | App version, plan version, sources, privacy statement, licences |
| Reset | Delete all data (type DELETE to confirm) |

---

## 4. Navigation map

```
Today ──┬─ Session player (full screen)
        ├─ Test wizard (full screen, on test weekends)
        └─ Day detail (yesterday / any past day)
Week ───── Day detail, swap days
Progress ┬ Shell → Day detail
         ├ Test trends → Test detail
         ├ Milestones
         └ At-99 board
Library ── Exercise page → Source detail
Settings ─ Backup / Reminders / Profile / About
```

---

## 5. Rules the app enforces

### 5.1 The plan calendar

- **Week 1** starts on the Monday chosen as the start date; **Week 0** is the seven days before it.
- **Block** = ceil(week ÷ 4). **Week in block** = ((week − 1) mod 4) + 1.
- **Light week:** week in block = 4. **Test week:** a light week whose block number is a multiple of 3, and Week 0.
- **Light-week changes:** strength sets −1 (never below 2); run and rope minutes × 0.7; interval reps halved, rounded up.
  The morning block, splits and habits are unchanged.
- **Interval stage:** Block 1 → stage 1, 2 → 2, 3 → 3, 4 onward → the 4 × 4 ([plan §6.7](2-exercise-plan.md#67-intervals--thursday)).
- **Swaps** live in a per-week override. They never change the template.

### 5.2 Day status and the tortoise streak

| Status | Rule | Colour |
|---|---|---|
| Full | Morning block and main session both done | Moss green |
| Shell | Morning block done, main session not | Shell amber |
| Missed | Neither done (decided once the day is over) | Brick outline |
| Paused | Marked sick or injured | Sky outline |
| Ahead | A future day | Pale beige |

- The split block and habits do not change the status; they feed their own counts and milestones.
- **Tortoise streak:** count back from today (from yesterday if today is not done yet). Stop at the first pair of missed
  days in a row. Paused days neither count nor break the streak. A single missed day stays inside the streak.
- **Longest streak:** the longest such run in the history.

### 5.3 Progression suggestions

- **Reps:** all sets at the top of the range, logged "Right" or "Too easy", in two sessions in a row → suggest the next
  level.
- **Holds:** all sets at the target → suggest the next level.
- **Two "Too hard" in a row** → suggest one level down.
- **After 14 or more days with no logs for a ladder** → suggest one level down for a week.
- **Endurance steps** (run–walk, rope) move only on the user's tap, at least 7 days apart, with a reminder of the 10%
  rule.
- The app never changes a level by itself: the user confirms each move, and the history keeps every change with its date.

---

## 6. Data model (IndexedDB database `tortoise`)

| Store | Key | Fields |
|---|---|---|
| `settings` | `"settings"` | startDate; profile {birthYear, sex, weightKg, heightCm} (all optional); units {mass, distance}; dumbbellKg; location {lat, lon, label} (optional); runDefault; reminders {morning, main per weekday}; backup {lastAt, everyDays} |
| `days` | `YYYY-MM-DD` | paused (sick, injured or none); morning {doneAt, items}; main {doneAt, sessionId, variant (outdoor or indoor), minutes, distanceKm, effort 1–10, note}; split {doneAt, kind (front, side, both or long)}; habits {steps, snacks 0–3, outdoorMin} |
| `logs` | auto id; indexes on date and on ladder | date, sessionId, exerciseId, ladderId, level, sets [{reps, seconds, kg}], feedback (easy, right or hard) |
| `levels` | ladderId | level, since, history [{level, date}] |
| `tests` | date of Day 1 | results {rockport {minutes, heartRate, weightKg}, broadJumpCm, hangS, farmerS, heightCm, wallCm, sitRise {sit, rise}, oneLeg {openL, openR, closedL, closedR}, pushups, squatHoldS, splits {frontL, frontR, side}, handstand {wallS, freeS}, restingHr}; computed {vo2max, sitRiseScore} |
| `overrides` | Monday of the week | swaps [[day, day]] |
| `milestones` | milestoneId | earnedAt |
| `meta` | `"meta"` | schemaVersion, createdAt, appVersion |

- Volume: one `days` record a day for 60 years is about 22,000 small records. IndexedDB handles that easily.
- Schema changes go through numbered migrations, each covered by a test with a fixture of the previous version.

---

## 7. Plan content model (static, shipped with the app)

One typed data module, validated by a schema in the tests and at start-up:

| Part | Holds |
|---|---|
| sources | id, citation, url, finding: mirrors [sources.md](sources.md) |
| exercises | id, name, area, how, cue, mistake, why, sources, video link (optional), unit (reps, seconds or minutes) |
| ladders | id, name, levels [{level, exerciseId, target (sets × reps or seconds, per side), pass rule}] |
| sessions | id, kind (morning, strength, run, intervals, long, light, split), minutes, steps [{ladderId or exerciseId, sets, reps / seconds / minutes, rest, paired with}], variants {outdoor, indoor} |
| week template | Monday–Sunday → {morning, main, split} |
| block rules | block length, light week, test cadence, light-week changes, interval stages |
| tests | id, name, how, unit, aim, sources, day (1 or 2), calculator (rockport, sitRise or none) |
| milestones | id, name, kind (streak, count, test or level), metric, threshold |
| start rules | Week 0 results → starting levels |

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
| Daylight | Sunrise, sunset, solar noon and day length from NOAA's solar equations (public domain), for the stored latitude, longitude and date; checked in tests against published NOAA values | — |
| Units | 1 kg = 2.20462 lb; 1 km = 0.621371 mi | — |
| Pillar minutes | Planned: the session templates. Done: logged minutes, or the template's minutes for a "Done as planned" | — |

---

## 9. Reminders

There are no push notifications in v1, because a web app needs a push server for them (D-013). Instead:
- Settings builds a calendar file (iCalendar, RFC 5545) with two weekly repeating events, the morning block and the main
  session, at the chosen times, each with an alarm.
- The times are floating local times, so they follow the phone's time zone.
- "Add to Calendar" hands the file to iOS through the share sheet, and the phone's own Calendar then rings the reminders,
  even when the app is closed.

---

## 10. Backup and restore

- **Export:** one JSON file, `tortoise-backup-YYYY-MM-DD.json`, holding a format tag and version, the export time, the app
  version, and every store. It goes out through the share sheet (Files, iCloud Drive, AirDrop to the Mac), with a plain
  download as the fallback.
- **Import:** pick a file → schema validation → migrate from older versions → a preview (record counts and date range) →
  **Merge** (the newer record wins for each key) or **Replace** → written in one transaction.
- **Reminder:** a banner on Today when the last backup is older than 30 days.
- A backup file is personal data. It goes wherever the user sends it, never into the repo.

---

## 11. Privacy and security

- A Content Security Policy allows only the app's own origin: `default-src 'self'`; `connect-src 'self'`;
  `img-src 'self' data: blob:`. No third-party scripts, fonts, analytics or cookies.
- External links (videos, sources) open in the browser, outside the app.
- Location for daylight is typed in or read once from the phone, stored on the phone, and never sent.
- The repo holds no personal facts; a test scans committed text for banned personal terms
  ([3-implementation.md](3-implementation.md), Phase 0).

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
| shell | `#B8792A` (amber) | `#E0A955` | Shell days, streaks |
| sky | `#2C7BB6` | `#6DB3E8` | Outdoor, daylight, paused days |
| brick | `#B23A2A` | `#E07A6A` | Missed days, warnings, delete |
| line | `#E4DCC8` (beige) | `#2C3B2E` | Borders and dividers |

- **Type:** the system font (SF Pro on iPhone), so nothing has to load. Timers are 64–96 px; headings 22–28 px semibold.
- **Icon:** a geometric tortoise whose shell is made of hexagons, matching the Shell calendar. App icons at 180, 192 and
  512 px, plus a maskable version and the Apple touch icon.
- **Layout:** one column; safe-area insets for the notch and the home indicator; tap targets of 44 pt or more.
- **Motion:** small and short; none when the system asks for reduced motion.

---

## 13. Accessibility

- Contrast of 4.5:1 or more for text, in both themes.
- Every control has a label; timers announce changes to VoiceOver.
- Layouts hold up with larger text.
- Colour is never the only signal: day statuses also differ by fill and outline, and the ring shows a count.

---

## 14. Out of scope, and later

| Not in the app | Why |
|---|---|
| Nutrition, sleep, medicine | The owner's scope: exercise only (D-001) |
| Accounts, cloud sync, sharing | Private, on-device design (D-012) |
| Push notifications | Would need a server; the calendar file does the job (D-013) |
| Apple Health, GPS tracking | Not available to a web app (Health), or a battery drain with no background mode (GPS) |

| Later, optional | Condition |
|---|---|
| Weather hint for outdoor days | Only from an official source that browsers can call (Environment and Climate Change Canada), with a city-level location the user sets; off by default (D-020) |
| Progress photos (posture, splits) | Stored on the phone only; can be left out of backups |
| Spoken coaching for whole sessions | If the cues prove useful |
