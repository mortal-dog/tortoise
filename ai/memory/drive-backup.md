---
name: drive-backup
description: How the Google Drive sync (D-054, D-055) works as the app's only backup — sign-in, the hidden-frame and next-tap renewal, the silent landing page, triggers, restore, the owner's Google Cloud steps, tests
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
- **When (D-055):** `autoSync()` uploads only when dirty (`onChange()` from `src/lib/live.ts` marks it) or when a
  sign-in's first sync has not finished: 20 s after the last change, on `visibilitychange` (hidden or shown), on
  `online`, and every 5 min while visible. With nothing to upload, an opening still renews a dead token so the
  visit's changes find a live one. A `TypeError` from fetch (or `navigator.onLine === false`) is status `offline`, no
  error, still dirty. No Background Sync (Safari has none).
- **Files:** one `device-<id>.json` per device in `appDataFolder`, a whole backup in the backup format (`BACKUP_FORMAT`,
  read back with `parseBackup`), photos included. Writes are resumable uploads (POST/PATCH `uploadType=resumable`,
  then PUT to the `Location` header), because photos can pass the 5 MB one-request limit.
- **Restore:** the first sync after a sign-in (`tortoise.drive` has no fileId and no lastSync: a new device, or after
  Reset or Sign out, which clear it) merges every device file (newer `updatedAt` wins); a damaged or newer file is
  skipped whole. There is no Restore button since D-055. A plain sync only uploads, so a deletion here (photos, swaps)
  is not undone by the Drive copy, and another device's later changes do not come in.
- **The card** (`DriveCard.tsx`): "Google Drive sync"; signed in, one line "Last sync: <formatLong date>, <HH:MM>"
  (or "not yet"), an error line only on an error, Sync now (shows "Syncing…" while busy) and Sign out; signed out,
  only "Sign in with Google". The owner wants no other wording on it (D-055).
- **Safety:** a phone with no `startDate` and no days never uploads; Reset calls `driveSignOut(false)` (forget, no
  revoke) so the empty phone cannot sync over its copy.
- **Client ID and the owner's steps:** the French app's Web client
  `392431386089-a3baa70ro45r5uegru6hjc23o9ptkhgj.apps.googleusercontent.com` (owner's picker "reuse"), consent screen in
  Testing. Both of the owner's steps are **done** (he confirmed each on 2026-11-23): the authorised JavaScript origin
  `https://tortoise.doctornova.net` (without it Google's window says "origin_mismatch") and the authorised redirect URI
  `https://tortoise.doctornova.net/oauth-silent.html` (without it every renewal waits for a tap). For dev sign-in,
  `http://localhost:5173` would be needed as an origin too.
- **Tests:** `tests/db/drive-sync.test.ts` drives `exchange()`, `syncNow()` and `autoSync()` with an in-memory fake
  `Drive` set by `resetSyncForTests(drive)` (it also re-reads the state from storage and disarms the tap);
  `resetGoogleForTests()` clears the cooldown and the cached script; a live token is faked by writing
  `tortoise.google` with a future `expiresAt`; the frame is answered by dispatching a `MessageEvent` with the iframe's
  own `state`; Google's script is faked on `window.google` and `fetch` is stubbed for the userinfo call. The component
  test checks the card's single line; `tests/e2e/smoke.spec.ts` frames `/oauth-silent.html` under the service worker
  and expects its post. Nothing in e2e talks to Google.

**Why:** the owner: "change the backup to a Google login with a Google Drive backup, like the French repo; the sync
is automatic, find a suitable time to sync by itself" (D-054); then "make sure google drive sync is automatic, and
remove other way to store backup and retrieve and just show sync", "remove all other wordings. you can just show last
sync date time", "delete backup file feature from settings" (D-055).

**How to apply:** unverified on a real phone until Phase 8: whether GIS's popup opens and returns from the home-screen
app on iOS (from the button and from the next-tap renewal), and whether Google exposes `Location` to the browser for
resumable uploads (Google's own CORS upload sample reads it). Safari refuses Google's cookies in the frame, so on the
iPhone expect renewals from the next tap. If the upload fails with "Google Drive gave no upload address", fall back to a
multipart upload for files under 5 MB. See [[building-pitfalls]].
