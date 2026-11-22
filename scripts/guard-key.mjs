// The personal-term guard's key (D-034): the TORTOISE_GUARD_KEY environment variable (the CI secret), or the untracked
// file .guard-key at the repo root. The key never goes into the repo.
import { createHmac } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export function loadGuardKey(root) {
  const fromEnv = process.env.TORTOISE_GUARD_KEY?.trim()
  if (fromEnv) return fromEnv
  const file = join(root, '.guard-key')
  if (existsSync(file)) return readFileSync(file, 'utf8').trim() || null
  return null
}

export function termHash(key, term) {
  return createHmac('sha256', key).update(term).digest('hex')
}

/** Lower-cased word tokens and every pair of neighbouring tokens. */
export function tokensAndPairs(text) {
  const tokens = text
    .normalize('NFKC')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
  const out = new Set(tokens)
  for (let i = 0; i + 1 < tokens.length; i++) out.add(`${tokens[i]} ${tokens[i + 1]}`)
  return out
}
