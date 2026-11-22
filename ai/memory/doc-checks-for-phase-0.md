---
name: doc-checks-for-phase-0
description: "The five doc checks run before the first commit on 2026-11-21 (sources defined and cited, links and GitHub anchors, D-numbers, banned personal terms, CJK), with their pitfalls; Phase 0 turns them into guard tests, the banned terms compared as hashes"
metadata:
  type: project
---

On 2026-11-21 a script in the session scratchpad (gone with the session) ran five checks. The first commit was chained
on it with `&&`.

1. Every `[id]` cited in the docs is defined in `docs/sources.md`, and every defined source is cited (45 sources).
2. Every relative link resolves, and every `#anchor` matches a heading under GitHub's slug rules.
3. Every `D-nnn` mentioned is defined in `docs/decisions.md`.
4. No banned personal terms in committed text: home city, employer, family words, personal names, email handle.
5. No CJK characters (the English-only rule).

**Pitfalls found:**
- **Source ids:** `octftf` has no year digits, so a `[a-z]+\d{4}` pattern skips it.
- **GitHub slugs:** backticks, commas, colons and em dashes are dropped, and the spaces around an em dash become `--`.
  For example, `### 6.7 Intervals — Thursday` becomes `#67-intervals--thursday`.
- **Timestamps:** the handoff sheet's first timestamp named the home city; times in this repo are ET only.
- **The guard list itself:** in this public repo the banned-term list cannot be committed in plain text, because it
  would publish the terms. The test should hash each lowercased token (and two-word pair) and compare against a
  committed set of hashes.

**Why:** the repo is public, and the plan's credibility rests on its sources. These checks caught 11 uncited sources and
a city name before the first commit.

**How to apply:** Phase 0 implements them as Vitest guard tests over all committed text, `ai/` included
(`docs/3-implementation.md` §3).
