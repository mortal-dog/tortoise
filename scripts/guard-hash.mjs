// Adds banned personal terms to the guard list as keyed hashes (D-034). Terms are read from standard input, one per
// line (a word, or two words separated by one space), so they never appear in the repo or in a command line.
// Usage: pnpm guard:hash < terms.txt   (needs .guard-key or TORTOISE_GUARD_KEY)
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadGuardKey, termHash, tokensAndPairs } from './guard-key.mjs'

const root = join(import.meta.dirname, '..')
const key = loadGuardKey(root)
if (!key) {
  console.error('No guard key: create .guard-key (untracked) or set TORTOISE_GUARD_KEY.')
  process.exit(1)
}
const listPath = join(root, 'tests/guard/banned-hashes.json')
const list = JSON.parse(readFileSync(listPath, 'utf8'))
const hashes = new Set(list.hashes)
let added = 0
for (const raw of readFileSync(0, 'utf8').split('\n')) {
  const term = raw.trim()
  if (!term) continue
  const forms = [...tokensAndPairs(term)].filter((t) => t.split(' ').length === term.split(/\s+/).length)
  for (const form of forms) {
    const h = termHash(key, form)
    if (!hashes.has(h)) {
      hashes.add(h)
      added++
    }
  }
}
list.hashes = [...hashes].sort()
writeFileSync(listPath, `${JSON.stringify(list, null, 2)}\n`)
console.log(`${added} hash(es) added; ${list.hashes.length} in the list.`)
