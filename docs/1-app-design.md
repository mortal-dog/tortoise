# 1 · App design

Tortoise is a phone app (a PWA, installed from the browser) that runs the [exercise plan](2-exercise-plan.md). It shows the
day's session, guides it with timers, records what was done, and keeps the tests and milestones for decades. Exercise
only: nutrition, sleep and medicine are out of scope.

**At a glance**

| | |
|---|---|
| Users | One person; the iPhone first (installed from Safari), and every other platform too: Android phones and desktop browsers install or run it the same way (D-047). The Google Drive sync moves the data between them (D-055) |
| Address | <https://tortoise.doctornova.net> |
| Data | On the phone (IndexedDB), with a copy in the user's own Google Drive once they sign in (D-054, D-055) |
| Network | None needed after the first load; app updates use it, and the Google Drive sync once the user signs in (D-054); an exercise video, only when its name is tapped (D-060). No server, no analytics, and no other third-party request |
| Language | English |

---

## 1. Principles

1. **The phone keeps the data.** Every log stays on the device; the only copy elsewhere is the one the user asks for by
   signing in, in a hidden folder of their own Google Drive (D-054). (The owner prefers auditable first-party code for
   private data; this design needs no third party besides that.)
2. **Offline first.** After the first load the app works with no network: in the basement, in airplane mode, on a trail.
3. **One tap per thing.** "Done as planned" is the default; editing reps or weights is optional. A normal day takes under
   ten taps to log.
4. **Forgiving streaks.** A 15-minute Shell day counts. The streak breaks only on two missed days in a row. There is no
   pause: the app counts what was done, not why not (D-057). ([§5.2](#52-day-status-and-the-tortoise-streak))
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
| Storage | IndexedDB on the device. WebKit counts days of use separately for home-screen web apps, so daily use keeps the data. The home-screen app keeps its own data, apart from Safari's (verify) | Ask for persistent storage; the Google Drive sync ([§10](#10-backup-and-restore)); the first run asks to install before starting ([§3.8](#38-first-run)) |
| The address is the data | Data belongs to the exact origin `https://tortoise.doctornova.net`; another address starts empty | The address was chosen once and never changes (decision D-010) |
| Sound | Web Audio starts only after a tap; the ring/silent switch may mute it (verify) | Unlock audio on the session's Start tap; every cue is also shown on screen |
| Speech | Safari's speech synthesis uses the phone's own voices and needs no network (verify in the home-screen app) | Spoken cues are optional; tones and text always carry the cue |
| Vibration | Safari has no Vibration API | Visual and sound cues only |
| Screen awake | Screen Wake Lock API in Safari; older iOS versions had it broken in home-screen mode (verify) | Keep the screen on whenever the app is open (D-050); if that fails, a notice in the player to set Auto-Lock |
| Background | iOS suspends a web app in the background; timers stop firing | Timers run from timestamps and catch up on return; cues need the screen on |
| Updates | An installed web app gets a new version only when its service worker updates | An update banner; Settings shows the app and plan versions |
| Health data | A web app cannot read Apple Health | Steps and run distance are typed in (optional) |

---

## 3. Screens

A bottom tab bar, within thumb reach, floating as a glass bar (D-048), holds four tabs: **Today · Week · Progress · Settings** (D-056). Only the pill that marks the open tab moves; the bar
itself stays still (D-059). The session player
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
- **Tapping any day** opens its page (D-057): each part (morning block, main session, split block) with its exercises,
  their level and dose, and each exercise's name opening its YouTube video. A day to come shows what to do; on a run
  day it also lists the indoor version (a longer brisk walk). A day that has passed, and today once a part is done,
  marks each exercise done or not done, and a past day with nothing done says so. Tapping an exercise's name plays
  its video in a full-screen sheet inside the app, in YouTube's privacy-enhanced player, loaded only on that tap
  (D-060). The player records which steps were
  finished; a "Done as planned" tap counts the whole part. The page is for reading: nothing is edited there.

### 3.4 Progress

Since D-062 Progress holds only the numbers, the milestones with their badges and the At-99 board: the Shell
honeycomb, the outdoor-sessions count, the photos, the test trends and the level charts went (the owner's ask).

- **Numbers:** the tortoise streak and the longest one; full days this month; Shell days; minutes per pillar
  (strength, aerobic, skills, mobility) this week against the plan.
- **Milestones:** "next up" with progress bars, and **badges** (D-058): every milestone is a tortoise-shell hexagon
  medal, its metal (bronze, gold, jade, sapphire) set by its step, with an icon and a ribbon. Earned medals shine (a
  glint sweeps across, two sparkles twinkle); locked ones are grey with a lock. A tap or hover tells how to earn one or
  when it was earned. A badge counts as earned when stored or when its goal is reached now, so a reached goal never
  shows locked.
- **The At-99 board:** each 99-year ability with its latest result ([plan §11](2-exercise-plan.md#11-milestones)).

### 3.5 Tortoise Test wizard

- Opens from Today on a test weekend, or from Progress at any time.
- Two parts, Day 1 (outdoors) and Day 2 (indoors), resumable across days.
- Each test card has its instructions, a built-in stopwatch where needed (the mile walk, the 15-second pulse count,
  one-leg stance capped at 60 s, farmer hold, squat hold), and input fields. Day 1 is the Rockport walk; Day 2 holds
  everything else, jump and reach included (D-056).
- Built-in calculators:
  - sit-to-rise: two steppers counting down from 5;
  - Rockport: time, heart rate and weight give the VO2max estimate; age and sex come from the profile, or are asked
    here;
  - height: the change against the tallest earlier record.
- Height is asked once a year: when the last height record is 48 weeks old or more.
- In Week 0 the wizard also asks the start question (how long an easy run is comfortable).
- On saving: comparison with the last test; milestones awarded; and, in Week 0, the starting levels set by the rules in
  [plan §8](2-exercise-plan.md#8-the-first-13-weeks).

### 3.7 Settings

| Section | Contents |
|---|---|
| Plan | Start date (the Monday of Week 1); "Restart from Week 0" on a chosen Monday (keeps history) |
| Profile (on this phone only) | Birth year, sex, weight and height: all optional, used only for HRmax and Rockport |
| Units | kg or lb; km or mi. One card |
| Google Drive sync | The last sync's date and time, and nothing else to read; Sign in with Google, or Sync now and Sign out ([§10](#10-backup-and-restore), D-054, D-055) |
| About | App version, plan version; **the equipment**: a yoga mat, a jump rope and one pair of fixed dumbbells (7–15 kg each), with what is already at home (a wall, a chair, a sofa, thick books, a stair), so nothing else is bought (D-063); the number of sources with a link to their list in the repo (opens outside the app); the privacy statement (Google only after sign-in, a YouTube video only on a tap); the runtime libraries' licences |
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
- **Until Week 0 begins:** Today shows the days left. The morning block can be tried; days
  before Week 0 have no status and no streak.
- The profile is optional. The Rockport test asks for age, sex and weight when it needs them.
- A link leads to Settings → Google Drive sync: signing in there restores the Drive copy instead of starting afresh (a
  new phone, or the move from the Safari tab to the home-screen app).

---

## 4. Navigation map

```
First run ─ Install card → start Monday
Today ──┬─ Session player (full screen)
        ├─ Test wizard (full screen, on test weekends)
        └─ Day detail (yesterday / any past day)
Week ───── Day detail, swap days
Progress ┬ Tortoise Test → test wizard
         ├ Milestones and badges
         └ At-99 board
Settings ─ Profile / Units / Google Drive sync / About
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
| Ahead | A future day, or today while nothing is done yet | Pale beige | Faint fill |

- On a test day, the day's part of the Tortoise Test counts as the main session. On Sunday the Light session is the
  main session.
- The split block does not change the status; it feeds its own counts and milestones.
- **Tortoise streak:** the number of done days, Full or Shell, in the current run.
  - Count back from today, or from yesterday while today has nothing done.
  - One missed day does not end the run, but adds nothing to the count. Two missed days in a row end it.
  - The run never reaches back before Week 0.
- **Longest streak:** the largest such count in the history.

### 5.3 Progression suggestions

- **Reps:** all sets at the top of the range, logged "Right" or "Too easy", in two sessions in a row → suggest the next
  level.
- **Holds:** all sets at the target → suggest the next level.
- **Two "Too hard" in a row** → suggest one level down.
- **After 14 or more days with no logs for a ladder** → suggest one level down for a week.
- **Endurance steps** (run–walk) move only on the user's tap, at least 7 days apart. Past the ladders, the run
  cards show last week's minutes and the most that the 10% rule allows this week.
- The app never changes a level by itself: the user confirms each move, and the history keeps every change with its date.

---

## 6. Data model (IndexedDB database `tortoise`)

| Store | Key | Fields |
|---|---|---|
| `settings` | `"settings"` | startDate; profile {birthYear, sex, weightKg, heightCm} (all optional); units {mass, distance}. Records from before D-053 also held dumbbellKg, location, runDefault and reminders, and from before D-055 backup {lastAt, everyDays}; they are dropped when read |
| `days` | `YYYY-MM-DD` | morning {doneAt, steps}; main {doneAt, sessionId, variant (outdoor or indoor), minutes, distanceKm, effort 1–10, note, asPlanned (a one-tap "Done as planned"), steps}; split {doneAt, kind (front, side, both or long), steps}; folded (the "Make it a Shell day" tap). `steps` lists the step ids the player finished; without it the whole part counts (D-057). Records from before D-057 may hold paused; it is dropped when read |
| `logs` | a random id, unique across devices; indexes on date and on ladder | date, sessionId, exerciseId, ladderId, level, sets [{reps, seconds, kg}], feedback (easy, right or hard) |
| `levels` | ladderId | level, since, history [{level, date}] |
| `tests` | date of Day 1 | results {rockport {minutes, heartRate, weightKg}, jumpReachCm, farmerS, heightCm, wallCm, sitRise {sit, rise}, oneLeg {openL, openR, closedL, closedR}, pushups, squatHoldS, splits {frontL, frontR, side}, handstand {wallS, freeS}, restingHr}; start answer {runMin} (Week 0 only); computed {vo2max, sitRiseScore} |
| `overrides` | Monday of the week | swaps [[day, day]] |
| `milestones` | milestoneId | earnedAt |
| `photos` | a random id; index on date | (no screen since D-062; the store and its Drive copy keep any photos taken before) date, dataUrl (a JPEG of at most 1280 px), note (optional); added by migration 2 (D-044) |
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

**The Google Drive sync (D-054, D-055)**, after the French app's sync, is the only backup: the backup file, its import
and the Today reminder went with D-055.
- **Sign-in:** Google Identity Services' token model in the browser, no server; the scope `drive.appdata` (a hidden
  folder only this app sees) and the e-mail address. A token lasts an hour and there is no refresh token.
- **Renewal, with no tap (D-055):** an hour-old sign-in is renewed in a hidden frame (`prompt=none`), which lands on the
  app's own `oauth-silent.html` and posts Google's answer back (the `state` is checked); the service worker serves that
  page as itself, never as the app. Where the browser refuses the frame (Safari blocks Google's cookies in it), the
  user's next tap anywhere in the app renews it: a tap may open Google's window, which closes by itself once consent
  was given. The sync card's own buttons are not that tap.
- **One file per device:** `device-<id>.json` in the hidden folder: a whole backup in one versioned JSON format (a
  format tag and version, the export time, the app and schema versions, every store). A device writes only its own
  file, so two devices never overwrite each other.
- **By itself:** when something changed since the last upload: 20 s after the last change, when the app goes to the
  background or comes back, when the connection returns, and every 5 minutes while on screen. An opening with nothing
  to upload still renews a dead sign-in, so the visit's changes find a live one. No network is a wait, not an error.
- **Restore:** signing in on a device for the first time (a new phone, or this one after "Delete all data") merges
  every device file into the phone first: the newer `updatedAt` wins (D-032). A file that is damaged or from a newer
  app is skipped whole. A plain sync only uploads, so a deleted photo does not come back.
- **Safety:** a phone with no plan and no days never uploads; "Delete all data" forgets the sign-in on the phone and
  leaves the Drive copy.
- **The card** shows only the last sync's date and time (the owner: "you can just show last sync date time"), an error
  when there is one, and its buttons.
- **The owner's steps:** the Web client (the French app's, his picker) must list `https://tortoise.doctornova.net` as
  an authorised JavaScript origin, and `https://tortoise.doctornova.net/oauth-silent.html` as an authorised redirect
  URI. Without the first, Google's window says "origin_mismatch"; without the second, every renewal waits for a tap.

---

## 11. Privacy and security

- A Content Security Policy allows the app's own origin, and Google's sign-in and Drive hosts for the sync (D-054):
  `default-src 'self'`; `script-src 'self' https://accounts.google.com`;
  `connect-src 'self' https://www.googleapis.com https://accounts.google.com`;
  `frame-src 'self' https://accounts.google.com https://www.youtube-nocookie.com` (the silent renewal's frame ends on
  the app's own page, D-055; YouTube's privacy-enhanced player, framed only after a tap on an exercise's name, D-060);
  `img-src 'self' data: blob:`. Google's script loads only once the user has signed in. No other third-party
  scripts, fonts, analytics or cookies. `oauth-silent.html` carries its own policy: `default-src 'none'; script-src
  'self'`.
- The Drive sync uses the `drive.appdata` scope: one hidden folder that only this app can see, nothing else in the
  user's Drive. The sign-in token stays in this browser's storage for its hour.
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
| sky | `#2A72AB` | `#6DB3E8` | Outdoor, daylight |
| brick | `#B23A2A` | `#E07A6A` | Missed days, warnings, delete |
| line | `#E4DCC8` (beige) | `#2C3B2E` | Borders, dividers, days ahead |

- **Contrast:** text, primary, primary-strong, shell, sky and brick each reach 4.5:1 or more on both the background and
  the surface, in both themes (computed with the WCAG formula).
- **Type:** the system font (SF Pro on iPhone), so nothing has to load. Timers are 64–96 px; headings 22–28 px semibold.
- **Icon:** a geometric tortoise whose shell is made of hexagons, matching the tortoise theme. App icons at 192 and
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
- **Small motion:** the tab bar's pill glides to the open tab (the bar itself never moves, D-059); a screen settles in
  with a short lift; buttons press in; earned badges shine (D-058); the big timer glows softly.
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
| Spoken coaching for whole sessions | If the cues prove useful |
