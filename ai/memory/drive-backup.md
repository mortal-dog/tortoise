---
name: drive-backup
description: How the Google Drive sync (D-054, D-055, D-071) works as the app's only backup — sign-in, the hidden-frame and next-tap renewal, the silent landing page, triggers, the shared file synced both ways, the first-sync ranking and conflict dialog, the owner's Google Cloud steps, tests
metadata:
  type: project
---

The Google Drive sync (D-054, 2026-11-23; the only backup since D-055, same day) is a port of the French app's sync
(`~/Repo/french` `src/features/sync/{google,drive,sync}.ts`), adapted to Tortoise's backup format. The backup file,
its import, the share sheet and the Today reminder are gone (D-055); `src/lib/backup.ts` keeps only the format, its
parser and the merge (`importBackup` is merge-only; `repo.ts` `mergeBackup()`).

- **Sign-in:** Google Identity Services' token model in the browser, no server. Scope `drive.appdata` + `email`. The
  session (email, token, expiry) sits in localStorage `tortoise.google`; the device id in `tortoise.deviceId`; the
  file id, last upload and dirty flag in `tortoise.drive`; `tortoise.googleSilent` = '1' once the frame renew has
  worked in this browser. Google's script (`accounts.google.com/gsi/client`) loads on the sign-in tap, or at start
  (`preloadGis()`) only when a session is stored, so an app nobody signed into makes no third-party request.
- **Renewal (D-055):** a token lasts an hour, no refresh token. `ensureToken()`: the stored token → `silentToken()` (a
  hidden iframe to `accounts.google.com/o/oauth2/v2/auth?response_type=token&prompt=none&login_hint=…`, landing on
  `public/oauth-silent.html`, whose `oauth-silent.js` posts `{source: 'tortoise/oauth-silent', params}` to the parent;
  `state` checked; 8-s timeout; 10-min cooldown after a refusal) → from a tap, the popup → otherwise `armNextTap()`:
  a one-shot capture listener on `click` and `keydown` that calls `signIn()` straight from the gesture. **`click`, not
  `pointerdown`:** a touch's pointerdown is not an activation-triggering event (HTML spec: only pointerup for
  non-mouse pointers, touchend, click, keydown, mousedown), so a popup from it is blocked on a phone. The card's
  buttons (`.js-sync-controls`, `SYNC_CONTROLS`) are exempt; `driveSignOut()` disarms; one sign-in at a time
  (`askForToken()`); a refused popup stops arming for the visit.
- **The landing page:** `oauth-silent.html` has its own CSP meta (`default-src 'none'; script-src 'self'`) and an
  external script, no inline code. The service worker serves every navigation the app shell **except**
  `/oauth-silent.html` (`src/sw/sw.ts`); without that exemption the frame would get the app. The app's CSP has
  `frame-src 'self' https://accounts.google.com` because the frame's redirect ends on the app's own origin.
- **When (D-055, D-071):** `autoSync()` = `syncNow()` unless signed out or a conflict waits: 20 s after the last own
  change (`onChange()` from `src/lib/live.ts`; writes from Drive notify with `fromSync` and are not counted), on
  `visibilitychange` (hidden or shown), on `online`, and every 5 min while visible. A `TypeError` from fetch (or
  `navigator.onLine === false`) is status `offline`, no error, still dirty. No Background Sync (Safari has none).
- **One shared file (D-071):** `tortoise.json` in `appDataFolder`, a whole backup in the backup format plus
  `generation` (optional zod field, BACKUP_VERSION still 1), photos included. Writes are resumable uploads
  (POST/PATCH `uploadType=resumable&fields=id,name,modifiedTime`, then PUT to the `Location` header). The D-054
  `device-*.json` files, and a second `tortoise.json` two devices created at once, are "extras": merged in, deleted
  after the write (only those read successfully).
- **Each sync (`exchange()`):** list the folder; read the shared file only when its id/modifiedTime differ from the
  cache (`tortoise.drive`: fileId, seen, generation, lastSync, dirty), or on a first sync, or with a choice; merge it
  (newer `updatedAt` wins, D-032); write when dirty, when the file is missing, when extras were merged, or when this
  device holds a record the copy lacks or holds older (`aheadOf`, so a write lost to a race heals at the next sync).
  A damaged or newer-version shared file is never written over: status error.
- **First sync after sign-in (no `generation` in the cache), and a generation mismatch:** `firstSync(local, remote)`
  ranks progress (a day with a done part or a logged set) 2, a plan alone 1, nothing 0; the higher side replaces the
  other whole (`replaceWithBackup` / a write with a new generation); equal 1, or equal 2 on the same `startDate`,
  merge; equal 2 on different plans → status `conflict` with both `summarize()`s → `SyncConflictDialog` (root layout):
  Use Google Drive's / Keep this device's / Sign out instead, then a confirm step; REPLACE typed when `losesMore()`
  (more days, earlier first day, or more badges on the replaced side). `resolveConflict(choice)` reruns with the
  choice. "Keep this device's" writes a new generation, so the other devices compare again instead of merging back.
- **No deletions while synced:** an undone week swap keeps its record with no swaps (a deleted record would come back
  from another copy). `deletePhoto` exists but has no screen since D-062.
- **The card** (`DriveCard.tsx`): "Google Drive sync"; signed in, one line "Last sync: <formatLong date>, <HH:MM>"
  (or "not yet"), an error line only on an error, Sync now (shows "Syncing…" while busy) and Sign out; signed out,
  only "Sign in with Google". The owner wants no other wording on it (D-055).
- **Settings synced too:** the spoken-cue switch lives in the settings record (`spokenCues`) since D-071; localStorage
  `tortoise.spokenCues` is only the player's fast copy.
- **Safety:** a phone with no `startDate` and no days never uploads; Reset calls `driveSignOut(false)` (forget, no
  revoke) so the empty phone cannot sync over its copy.
- **Client ID and the owner's steps:** the French app's Web client
  `392431386089-a3baa70ro45r5uegru6hjc23o9ptkhgj.apps.googleusercontent.com` (owner's picker "reuse"), consent screen in
  Testing. Both of the owner's steps are **done** (he confirmed each on 2026-11-23): the authorised JavaScript origin
  `https://tortoise.doctornova.net` (without it Google's window says "origin_mismatch") and the authorised redirect URI
  `https://tortoise.doctornova.net/oauth-silent.html` (without it every renewal waits for a tap). For dev sign-in,
  `http://localhost:5173` would be needed as an origin too.
- **Tests:** `tests/db/drive-sync.test.ts` drives `exchange()`, `syncNow()`, `autoSync()` and `resolveConflict()`
  with an in-memory fake `Drive` (modified time moves on each write; `anotherDevice()` wipes the DB and cache to play a
  second phone; `editShared()` plays another device's write; `noteChangeForTests()` marks a change) set by
  `resetSyncForTests(drive)` (it also re-reads the state from storage and disarms the tap);
  `resetGoogleForTests()` clears the cooldown and the cached script; a live token is faked by writing
  `tortoise.google` with a future `expiresAt`; the frame is answered by dispatching a `MessageEvent` with the iframe's
  own `state`; Google's script is faked on `window.google` and `fetch` is stubbed for the userinfo call. The component
  tests check the card's single line and the conflict dialog's steps (`tests/component/sync-conflict.test.tsx`); `tests/e2e/smoke.spec.ts` frames `/oauth-silent.html` under the service worker
  and expects its post. Nothing in e2e talks to Google.

**Why:** the owner: "change the backup to a Google login with a Google Drive backup, like the French repo; the sync
is automatic, find a suitable time to sync by itself" (D-054); then "make sure google drive sync is automatic, and
remove other way to store backup and retrieve and just show sync", "remove all other wordings. you can just show last
sync date time", "delete backup file feature from settings" (D-055); 2026-11-27: on sign-in a just-started device
must take Drive's progress, every state must sync to another device, and a clash must let the user choose, confirmed
"again and again" when the overwritten side is older or larger (D-071).

**How to apply:** unverified on a real phone until Phase 8: whether GIS's popup opens and returns from the home-screen
app on iOS (from the button and from the next-tap renewal), and whether Google exposes `Location` to the browser for
resumable uploads (Google's own CORS upload sample reads it), whether the final upload response carries
`modifiedTime` (if not, each sync after an upload reads the copy once more, harmless), and DELETE in appDataFolder. Safari refuses Google's cookies in the frame, so on the
iPhone expect renewals from the next tap. If the upload fails with "Google Drive gave no upload address", fall back to a
multipart upload for files under 5 MB. See [[building-pitfalls]].

**D-074 (2026-11-27): the next-tap popup is rationed.** `armNextTap()` arms only while `waiting()` (cache `dirty`, or
no `generation` yet) and only if `tapUsed` is false; the armed tap sets it, a return to the screen clears it. In Safari
the hidden frame never renews, so before this every hour any tap opened Google's window ("feels like a virus"). A test
of the rationing must wait after `document.body.click()` (the popup opens after an awaited `loadGis()`); asserting at
once passed even with the gate removed.
