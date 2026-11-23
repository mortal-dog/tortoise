// No personal terms in committed text (D-022). The list is kept as keyed hashes (D-034); see scripts/guard-hash.mjs.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadGuardKey, termHash, tokensAndPairs } from '../../scripts/guard-key.mjs'
import { ROOT, repoTextFiles } from './repo'

const list = JSON.parse(readFileSync(join(ROOT, 'tests/guard/banned-hashes.json'), 'utf8')) as {
  hashes: string[]
}
const key = loadGuardKey(ROOT)
const inCi = !!process.env.CI

describe('personal terms', () => {
  it.skipIf(!key && inCi)(
    'appear in no committed file',
    () => {
      if (!key) {
        throw new Error(
          'The guard key is missing: create .guard-key at the repo root (untracked), see D-034.',
        )
      }
      expect(list.hashes.length).toBeGreaterThan(0)
      const banned = new Set(list.hashes)
      const hits: string[] = []
      for (const file of repoTextFiles()) {
        for (const [n, line] of file.text.split('\n').entries()) {
          for (const t of tokensAndPairs(line)) {
            // The term itself is never printed, only where it is.
            if (banned.has(termHash(key, t))) hits.push(`${file.path}:${n + 1}`)
          }
        }
        // Also catch a term split across a line break.
        for (const t of tokensAndPairs(file.text)) {
          if (
            t.includes(' ') &&
            banned.has(termHash(key, t)) &&
            !hits.some((h) => h.startsWith(`${file.path}:`))
          ) {
            hits.push(`${file.path} (across lines)`)
          }
        }
      }
      expect(hits).toEqual([])
      // It reads every committed file; vitest's 5-s default failed it on a loaded machine (2026-11-23).
    },
    30_000,
  )
})
