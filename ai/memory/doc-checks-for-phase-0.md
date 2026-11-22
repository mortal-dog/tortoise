---
name: doc-checks-for-phase-0
description: "The doc checks run before each docs commit (sources defined and cited, links and GitHub anchors, D-numbers, table shapes, banned personal terms, CJK, theme contrast, mock widths), with their pitfalls; Phase 0 turns them into guard tests, the banned terms kept as keyed hashes (D-034)"
metadata:
  type: project
---

A script in the session scratchpad (gone with each session) ran these checks before the first commit on 2026-11-21
and again before the review commit `fbf692e`. Each commit was chained on the script with `&&`.

1. Every `[id]` cited in the docs is defined in `docs/sources.md`, and every defined source is cited (45 sources).
2. Every relative link resolves, and every `#anchor` matches a heading under GitHub's slug rules (71 links).
3. Every `D-nnn` mentioned is defined in `docs/decisions.md`, with no gap, and "Next number" is the maximum plus one
   (D-001 to D-035, next D-036).
4. Every table row has as many cells as its header.
5. No banned personal terms in committed text: home city, employer, family words, personal names, email handle.
6. No CJK characters (the English-only rule).
7. Theme contrast: each text-capable token against the background and the surface, in both themes, by the WCAG
   formula. The first light-theme amber and sky failed 4.5:1 (D-033).
8. The Today mock: every row as wide as its border.

**Pitfalls found:**
- **Source ids:** `octftf` has no year digits, so a `[a-z]+\d{4}` pattern skips it.
- **Citations against other brackets:** checkboxes `[x]` and the placeholder `[id]` in `ai/` files match a citation
  pattern. Scan `docs/` and `README.md` for citations, not `ai/`.
- **GitHub slugs:** backticks, commas, colons and em dashes are dropped, and the spaces around an em dash become `--`.
  For example, `### 6.7 Intervals — Thursday` becomes `#67-intervals--thursday`.
- **Section references:** a `§n` in `docs/3-implementation.md` often points into the exercise plan (the Phase 1 table),
  so it cannot be checked against that file's own headings.
- **Mock widths:** an emoji takes two columns. Count display cells (East Asian width), not characters.
- **Timestamps:** the handoff sheet's first timestamp named the home city; times in this repo are ET only.
- **The guard list itself:** in this public repo the banned-term list cannot be committed in plain text, because it
  would publish the terms. A plain hash is not enough either: a city or a first name falls to a dictionary attack. The
  list is kept as keyed hashes (HMAC-SHA-256 of each lowercased token and two-word pair), and the key stays outside the
  repo, in an untracked local file and a CI secret (D-034). A local run without the key fails; a CI run without the
  secret reports the test as skipped.

**Why:** the repo is public, and the plan's credibility rests on its sources. These checks caught 11 uncited sources and
a city name before the first commit.

**How to apply:** Phase 0 implements them as Vitest guard tests over all committed text, `ai/` included
(`docs/3-implementation.md` §3). Until then, rewrite the script in the scratchpad before any docs commit.
