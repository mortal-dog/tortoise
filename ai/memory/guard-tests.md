---
name: guard-tests
description: "The guard tests in tests/guard/ (personal terms as keyed hashes, CJK, grey classes, sources, links and anchors, D-numbers, table shapes, theme contrast): what each reads, what it skips, the key, how to add a term, and the doc-check pitfalls they encode"
metadata:
  type: project
---

Phase 0 turned the old scratchpad doc checks into Vitest guard tests (`tests/guard/`, commit `79befb7`). They run in
`pnpm test` and in CI.

**What they read:** `git ls-files --cached --others --exclude-standard`, minus binary extensions: every tracked file
plus new files not ignored, `ai/` included. So anything a commit could publish. Ignored paths (`.guard-key`,
`.claude/`, `dist/`, `test-results/`) are not read.

| Test | Reads | Skips |
|---|---|---|
| `personal-terms` | every repo text file, line by line (tokens and two-word pairs), and each whole file for pairs split across lines | nothing; without a key it fails locally and is skipped when `CI` is set |
| `text` CJK | every repo text file | nothing |
| `text` grey classes | `src/` and `index.html` | a match preceded by a `disabled:` variant |
| `docs` sources | citations in `docs/` and `README.md` only (the `[x]` checkboxes of `ai/` would match) | `[text](link)` brackets; brackets whose items are neither defined ids nor `name+4 digits` |
| `docs` links | every `.md` file, outside code fences and code spans | `http(s):` and `mailto:` links |
| `docs` D-numbers | every repo text file | the next number (max + 1) is allowed |
| `docs` tables | every `.md` file | tables inside code fences |
| `contrast` | the `:root` and dark blocks of `src/styles.css` | — |

Not automated: the Today mock's widths (emoji take two columns: count display cells).

**The key (D-034):** HMAC-SHA-256, key in the untracked `.guard-key` (32 random bytes, hex) or `TORTOISE_GUARD_KEY`
(the CI secret, set 2026-11-22). The list is `tests/guard/banned-hashes.json` (17 hashes). The terms themselves are
stored nowhere. To add one: `pnpm guard:hash < file` (one term per line; a two-word term is one line). A hit prints
only `path:line`, never the term.

**Pitfalls they encode:**
- Source ids: `octftf` has no year digits, so a `[a-z]+\d{4}` pattern alone skips it; defined ids count too.
- GitHub slugs (github-slugger): backticks, commas, colons and em dashes are dropped, and the spaces around an em dash
  become `--` (`### 6.7 Intervals — Thursday` → `#67-intervals--thursday`); repeats get `-1`, `-2`.
- A `§n` in `docs/3-implementation.md` often points into the exercise plan, so section references are not checked.
- Biome forbids exports from test files (`noExportsInTest`): shared helpers live in `tests/guard/repo.ts`.

**Why:** the repo is public, and the plan's credibility rests on its sources. The checks caught 11 uncited sources and
a city name before the first commit, and a literal CJK range written into a regex on 2026-11-22.

**How to apply:** a red guard is a real leak or broken doc until shown otherwise. Read a test's skip column before
trusting its zero ([[building-pitfalls]]).
