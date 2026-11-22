import { describe, expect, it } from 'vitest'
import { repoTextFiles } from './repo'

const CJK =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\u3000-\u303f\uff00-\uffef]/u
const GREY = /\b(?:gray|grey|slate|zinc|neutral|stone)-(?:\d{2,3}|50)\b/

describe('committed text', () => {
  it('holds no CJK characters (English only, D-023)', () => {
    const hits: string[] = []
    for (const f of repoTextFiles()) {
      for (const [n, line] of f.text.split('\n').entries())
        if (CJK.test(line)) hits.push(`${f.path}:${n + 1}`)
    }
    expect(hits).toEqual([])
  })

  it('uses no grey utility classes outside disabled styles (D-024)', () => {
    const hits: string[] = []
    const ui = repoTextFiles().filter((f) => /^(src\/|index\.html)/.test(f.path))
    for (const f of ui) {
      for (const [n, line] of f.text.split('\n').entries()) {
        for (const m of line.matchAll(new RegExp(GREY, 'g'))) {
          const before = line.slice(0, m.index)
          if (!/disabled:\S*$/.test(before)) hits.push(`${f.path}:${n + 1} ${m[0]}`)
        }
      }
    }
    expect(hits).toEqual([])
  })
})
