// Helpers for the guard tests: the repo's committed (and about-to-be-committed) text files.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

export const ROOT = join(import.meta.dirname, '..', '..')

const BINARY = /\.(png|jpe?g|gif|webp|ico|woff2?|ttf|otf|pdf|zip)$/i

export interface RepoFile {
  path: string
  text: string
}

let cache: RepoFile[] | null = null

/** Every tracked file plus new files that are not ignored: what a commit can publish. */
export function repoTextFiles(): RepoFile[] {
  if (cache) return cache
  const out = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
  cache = out
    .split('\0')
    .filter((p) => p && !BINARY.test(p))
    .filter((p) => {
      const full = join(ROOT, p)
      return existsSync(full) && statSync(full).isFile()
    })
    .map((p) => ({ path: p, text: readFileSync(join(ROOT, p), 'utf8') }))
  return cache
}

export function markdownFiles(): RepoFile[] {
  return repoTextFiles().filter((f) => f.path.endsWith('.md'))
}

export function readRepoFile(path: string): string {
  return readFileSync(join(ROOT, path), 'utf8')
}

/** Removes fenced code blocks, keeping line numbers. */
export function stripFences(text: string): string {
  let inFence = false
  return text
    .split('\n')
    .map((line) => {
      if (/^\s*```/.test(line)) {
        inFence = !inFence
        return ''
      }
      return inFence ? '' : line
    })
    .join('\n')
}

/** The source ids defined in docs/sources.md (the first cell of each table row). */
export function definedSources(): string[] {
  const ids: string[] = []
  for (const line of readRepoFile('docs/sources.md').split('\n')) {
    const m = /^\| ([a-z][a-z0-9]*) \|/.exec(line)
    if (m?.[1] && m[1] !== 'id') ids.push(m[1])
  }
  return ids
}
