<!-- The handoff sheet of this repo (protocol: ~/Repo/script/claude/resume.md).
     The launchd backstop com.zerodte.resume reads the section from `# In progress` to the first `---`;
     notes go in this comment, never inside the section. Finished entries move to resume-done.md.
     This repo is PUBLIC: no personal health or household facts in this file. -->

# In progress

## Drive sync only: renew the Google session by itself, remove the file backup and its reminder — started 2026-11-23 11:03 ET

**Why:** the owner, 2026-11-23: "make sure google drive sync is automatic, and remove other way to store backup and
retrieve and just show sync".

Later asks the same turn: "remove all other wordings. you can just show last sync date time" and "delete backup file
feature from settings".

**Done**
- [x] ♻️ read ai/now.md, ai/memory/drive-backup.md, the global note on browser-only OAuth renew
- [x] ♻️ built in the working tree (uncommitted): google.ts silent renew, sync.ts next-tap renew + triggers,
      public/oauth-silent.{html,js}, sw.ts exemption, CSP frame-src 'self', DriveCard shows only "Last sync", BackupCard /
      BackupReminder / share.ts deleted, importBackup merge-only, settings `backup` field gone; tests; docs + D-055
- [x] ♻️ gates green 2026-11-23: check, 287 Vitest in 32 files, build, 20 e2e
- [x] ⚠️ committed as "feat: the Google Drive sync is the only backup, and renews its sign-in by itself (D-055)" —
      check `git log` before committing again

**Next**
- [ ] ⛔ push / deploy only after the owner's picker (CLAUDE.md rule 8)

**Don't forget:** a new redirect URI (silent renew page) is the owner's step in the Google Cloud console.

---
