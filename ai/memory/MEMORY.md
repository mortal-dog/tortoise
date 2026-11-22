# Memory Index

Project facts for Tortoise, one file each. This repo is PUBLIC: project facts only, never personal ones (D-022).

- [Evidence pitfalls](evidence-pitfalls.md) — the Rockport L/min form, static over PNF, the VO2max slope, the strength J-curve, small or non-significant studies; found on the 2026-11-21 re-read: nielsen2014 is not significant, a likelihood ratio, animal and postmenopausal-only studies, numbers that sit in a full text or an appendix, a misquote
- [Guard tests](guard-tests.md) — tests/guard/: what each reads and skips, the keyed-hash key (.guard-key, CI secret TORTOISE_GUARD_KEY), `pnpm guard:hash`, slug and source-id pitfalls
- [Building pitfalls](building-pitfalls.md) — .claude/ worktrees vs Biome and guards; TypeScript 7 DOM/WebWorker split; Playwright clock, exact names, async checkboxes, offline proof; vitest TZ; NOAA values read from the xls, not by running NOAA's script
- [Reading sources in raw text](reading-sources-raw.md) — NCBI efetch for PubMed abstracts and PMC full texts, Europe PMC's supplementaryFiles for appendices, raw markdown for GitHub docs; pmc.ncbi.nlm.nih.gov and cmaj.ca refuse automated readers; where the oc2023, katzman2010 and sheaf2017 numbers sit
