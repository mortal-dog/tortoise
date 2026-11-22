---
name: ci-pipeline
description: "CI/CD as built (D-039, D-046, D-049): its jobs, why the e2e render at 1x on CI, run timings and where the time goes, testing a workflow change on a branch with deploy off, the concurrency queue, manual runs and the owner's yes, speed-ups tried and rejected"
metadata:
  type: project
---

- **Jobs** (`.github/workflows/ci.yml`): `changes` (scheduled runs only; skips the slot when main's head sha is the last
  green run's), `check, test, build` (`pnpm check && pnpm test && pnpm build`; uploads `dist/` as the Pages artifact;
  holds the guard key secret), `e2e 1/3` to `e2e 3/3` (each runs `pnpm exec playwright install --with-deps webkit`, then
  `pnpm e2e --shard=N/3`, with `TORTOISE_E2E_DPR=1`), `deploy` (needs `checks` and `e2e`; main only; Pages set up;
  a scheduled run or the `deploy` input). A skipped job skips its dependants unless their `if` says otherwise, so
  `checks` and `e2e` start with `!cancelled()` and `deploy` names each needed job's result.
- **The build is deterministic** (the service worker's version is a hash of the files): two builds compared byte for
  byte, so the e2e shards' own builds are the files that deploy.
- **Timings (2026-11-22):** run #3, one job: 2:33 (58 s installing WebKit, 33 s of e2e on 2 workers, 12 s for the other
  gates). Side by side: the gate jobs finished in 62 s on `e64c8ed`; on `3fa4a81`, 1:43 with the deploy off. In each
  e2e job the apt part of the WebKit install took 23 to 58 s (mirror speed); the browser download takes 4 s. With 22
  tests the shards hold 8, 7 and 7; shard 2 has both player tests and both screen tests, the slowest.
- **The glass on CI (D-049):** CI's WebKit draws without a GPU, and the glass panels and the four 95vmax glow layers
  (D-048) cost per pixel; the iPhone profile renders at 3x, nine times the pixels of 1x. At 3x the shards took 37 to 70 s
  instead of 12 to 22 s, and the player test hit its 30-s limit in two runs. Bisected on CI: `856d3d7` fast (17/19/13
  s), `af76e29` slow. Probes: no blur 36/46/30 s; Moving background off 33/41/74 s (flaky); reduced motion 42/50/40 s;
  1x 18/32/21 s; 1x and a still backdrop 18/27/18 s (not taken: within the spread between runs). On the Mac the GPU hid
  it: the whole suite on 2 workers took 50 s at 3x and 38 s at 1x.
- **Test a workflow change without deploying:** push a branch (from a temporary worktree, so main's tree stays as it
  is), run `gh workflow run ci.yml --repo mortal-dog/tortoise --ref <branch> -f deploy=false`, read the jobs with
  `gh api repos/mortal-dog/tortoise/actions/runs/<id>/jobs` and the annotations with `.../check-runs/<job id>/annotations`,
  then delete the branch. A branch run never deploys: the deploy job wants `refs/heads/main`, and the `github-pages`
  environment allows main only. The workflow file must already be on main for `workflow_dispatch` to accept the branch.
- **The concurrency group `ci-cd`** runs one run at a time; a newer pending run replaces an older pending one, so probes
  go one after another.
- **Manual runs from the session:** a deploying `gh workflow run` was refused without the owner's yes; after his picker
  "Push and deploy now" it went through (14:49 ET). Runs with `-f deploy=false` went through without asking.
- **Logs:** `gh run view <run> --log --job <id>`, then strip the colour codes with sed; `gh api .../jobs/<id>/logs`
  refuses output with escape sequences unless given `--allow-escape-sequences`.
- **Rejected speed-ups:** the Playwright image `mcr.microsoft.com/playwright:v1.65.1-noble` (1 GB compressed, about as
  slow to pull as the apt install it saves); a browser cache (it saves the 4-s download); a fourth shard (each shard is
  another draw of the apt time, and the slowest decides); a still backdrop in the tests (a few seconds, within the
  spread). Caching apt's .deb files was not tried: the runner image changes under it.

**Why:** measured on 2026-11-22 while making CI faster (D-046) and finding the glass slowdown (D-049).

**How to apply:** read this before changing `ci.yml` or the e2e setup; judge CI speed on CI, and when it slows, rerun
the last fast commit as a control and bisect before guessing ([[building-pitfalls]]).
