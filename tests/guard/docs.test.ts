// The docs hold together (docs/3-implementation.md §3): sources, links and anchors, D-numbers, table shapes.
import { existsSync } from 'node:fs'
import { dirname, join, normalize } from 'node:path'
import { describe, expect, it } from 'vitest'
import { definedSources, markdownFiles, ROOT, readRepoFile, repoTextFiles, stripFences } from './repo'

const ID_SHAPE = /^[a-z]+\d{4}[a-z]?$/

function citations(text: string, defined: Set<string>): string[] {
  const out: string[] = []
  for (const m of text.matchAll(/\[([a-z][a-z0-9]*(?:,\s*[a-z][a-z0-9]*)*)\](?!\()/g)) {
    const items = (m[1] ?? '').split(/,\s*/)
    if (items.every((i) => defined.has(i) || ID_SHAPE.test(i))) out.push(...items)
  }
  return out
}

/** GitHub's heading slugs (github-slugger), with -1, -2 for repeats. */
function headingSlugs(markdown: string): Set<string> {
  const seen = new Map<string, number>()
  const out = new Set<string>()
  for (const line of stripFences(markdown).split('\n')) {
    const m = /^#{1,6}\s+(.*?)\s*#*\s*$/.exec(line)
    if (!m?.[1]) continue
    const text = m[1].replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    const base = text
      .toLowerCase()
      .replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, '')
      .replace(/ /g, '-')
    const n = seen.get(base) ?? 0
    seen.set(base, n + 1)
    out.add(n === 0 ? base : `${base}-${n}`)
  }
  return out
}

function splitRow(line: string): string[] {
  const noCode = line.replace(/`[^`]*`/g, 'x').replace(/\\\|/g, 'x')
  const trimmed = noCode.trim().replace(/^\|/, '').replace(/\|$/, '')
  return trimmed.split('|')
}

describe('sources', () => {
  const defined = definedSources()
  const set = new Set(defined)
  const citing = markdownFiles().filter((f) => f.path.startsWith('docs/') || f.path === 'README.md')

  it('are defined once each', () => {
    expect(defined.length).toBeGreaterThan(40)
    expect(new Set(defined).size).toBe(defined.length)
  })

  it('cited in the docs are all defined', () => {
    const unknown: string[] = []
    for (const f of citing) {
      for (const id of citations(stripFences(f.text), set)) if (!set.has(id)) unknown.push(`${f.path}: ${id}`)
    }
    expect(unknown).toEqual([])
  })

  it('are each cited outside sources.md', () => {
    const cited = new Set<string>()
    for (const f of citing) {
      if (f.path === 'docs/sources.md') continue
      for (const id of citations(f.text, set)) cited.add(id)
    }
    expect(defined.filter((id) => !cited.has(id))).toEqual([])
  })
})

describe('links', () => {
  it('relative links and anchors resolve', () => {
    const broken: string[] = []
    for (const f of markdownFiles()) {
      const text = stripFences(f.text).replace(/`[^`]*`/g, '')
      for (const m of text.matchAll(/\]\(([^)\s]+)\)/g)) {
        const target = m[1] ?? ''
        if (/^(https?:|mailto:)/.test(target)) continue
        const [pathPart, anchor] = target.split('#') as [string, string | undefined]
        const resolved = pathPart ? normalize(join(dirname(f.path), pathPart)) : f.path
        if (!existsSync(join(ROOT, resolved))) {
          broken.push(`${f.path}: ${target}`)
          continue
        }
        if (anchor && resolved.endsWith('.md') && !headingSlugs(readRepoFile(resolved)).has(anchor)) {
          broken.push(`${f.path}: ${target}`)
        }
      }
    }
    expect(broken).toEqual([])
  })
})

describe('decisions', () => {
  const text = readRepoFile('docs/decisions.md')
  const numbers = [...text.matchAll(/^\| D-(\d{3}) \|/gm)].map((m) => Number(m[1]))
  const max = Math.max(...numbers)

  it('run from D-001 with no gap or repeat', () => {
    expect([...numbers].sort((a, b) => a - b)).toEqual(Array.from({ length: max }, (_, i) => i + 1))
  })

  it('give the next number as the maximum plus one', () => {
    const next = /\*\*Next number: D-(\d{3})\*\*/.exec(text)
    expect(Number(next?.[1])).toBe(max + 1)
  })

  it('mentioned anywhere are defined (or the next number)', () => {
    const bad: string[] = []
    for (const f of repoTextFiles()) {
      for (const m of f.text.matchAll(/\bD-(\d{3})\b/g)) {
        const n = Number(m[1])
        if (n < 1 || n > max + 1) bad.push(`${f.path}: D-${m[1]}`)
      }
    }
    expect(bad).toEqual([])
  })
})

describe('tables', () => {
  it('have as many cells in every row as in the header', () => {
    const bad: string[] = []
    for (const f of markdownFiles()) {
      const lines = stripFences(f.text).split('\n')
      for (let i = 0; i + 1 < lines.length; i++) {
        const header = lines[i] ?? ''
        const sep = lines[i + 1] ?? ''
        if (!header.trim().startsWith('|') || !/^\s*\|(\s*:?-+:?\s*\|)+\s*$/.test(sep)) continue
        const width = splitRow(header).length
        for (let j = i + 1; j < lines.length && (lines[j] ?? '').trim().startsWith('|'); j++) {
          if (splitRow(lines[j] ?? '').length !== width) bad.push(`${f.path}:${j + 1}`)
        }
      }
    }
    expect(bad).toEqual([])
  })
})

describe('the slug rules themselves', () => {
  it('follow GitHub: an em dash between spaces becomes two hyphens', () => {
    expect(headingSlugs('### 6.7 Intervals — Thursday').has('67-intervals--thursday')).toBe(true)
    expect(headingSlugs('## 12. Visual design\n## 12. Visual design').has('12-visual-design-1')).toBe(true)
  })
})
