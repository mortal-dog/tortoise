---
name: drive-backup
description: How the Google Drive backup (D-054) works, its limits, the owner's Google Cloud step, and how to test it
metadata:
  type: project
---

The Google Drive backup (D-054, 2026-11-23) is a port of the French app's sync (`~/Repo/french`
`src/features/sync/{google,drive,sync}.ts`), adapted to Tortoise's backup format.

- **Sign-in:** Google Identity Services' token model in the browser, no server. Scope `drive.appdata` + `email`. The
  session (email, token, expiry) sits in localStorage `tortoise.google`; the device id in `tortoise.deviceId`; the
  file id, last upload and dirty flag in `tortoise.drive`. Google's script (`accounts.google.com/gsi/client`) loads only
  on the sign-in tap, so no third-party request happens before it.
- **Client ID:** the French app's Web client `392431386089-a3baa70ro45r5uegru6hjc23o9ptkhgj.apps.googleusercontent.com`
  (owner's picker "reuse"), consent screen in Testing. **Owner step:** add `https://tortoise.doctornova.net` (and
  `http://localhost:5173` for dev) to its authorised JavaScript origins; without it Google's window says
  "origin_mismatch". The Settings card states this.
- **Files:** one `device-<id>.json` per device in `appDataFolder`, a whole backup in the backup file's format
  (`BACKUP_FORMAT`, read back with `parseBackup`), photos included. Writes are resumable uploads (POST/PATCH
  `uploadType=resumable`, then PUT to the `Location` header), because photos can pass the 5 MB one-request limit.
- **When:** only with a live token and only when dirty (`onChange()` from `src/lib/live.ts` marks it): 20 s after the
  last change, on `visibilitychange` to hidden, and on open or return after 3 min. A token lasts an hour with no
  refresh token; after it, status "needs-tap" and the user taps **Sync now** (a popup that closes itself).
- **Restore:** a device's first sign-in and "Restore from Google Drive" merge every device file (newer `updatedAt`
  wins, `importBackupFile(…, 'merge')`); a damaged or newer file is skipped whole. A plain sync only uploads, so a
  deletion here (photos, swaps) is not undone by the Drive copy; a restore can bring a deleted photo back.
- **Safety:** a phone with no `startDate` and no days never uploads; Reset calls `driveSignOut(false)` (forget, no
  revoke) so the empty phone cannot sync over its copy.
- **CSP** (`scripts/vite-pwa-plugin.ts`): `script-src 'self' https://accounts.google.com`, `connect-src 'self'
  https://www.googleapis.com https://accounts.google.com`, `frame-src https://accounts.google.com`;
  `tests/e2e/smoke.spec.ts` checks the first two.
- **Tests:** `tests/db/drive-sync.test.ts` drives `exchange()` and `syncNow()` with an in-memory fake `Drive`; a live
  token is faked by writing `tortoise.google` with a future `expiresAt`. Nothing in e2e talks to Google.

**Why:** the owner: "change the backup to a Google login with a Google Drive backup, like the French repo; the sync
is automatic, find a suitable time to sync by itself"; his pickers kept the file backup as a fallback.

**How to apply:** unverified on a real phone until Phase 8: whether GIS's popup opens and returns from the
home-screen app on iOS, and whether Google exposes `Location` to the browser for resumable uploads (Google's own
CORS upload sample reads it). If the upload fails with "Google Drive gave no upload address", fall back to a
multipart upload for files under 5 MB. See [[building-pitfalls]].
