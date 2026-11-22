// The library's content (implementation Phase 5): every exercise fully explained, the plan's why table matching the
// data, and every teaching link well formed, checked, and a link rather than an embed.
import { describe, expect, it } from 'vitest'
import { plan } from '@/data/plan'
import { noLinkFound, videos } from '@/data/videos'
import { readRepoFile } from '../guard/repo'

const doc = readRepoFile('docs/2-exercise-plan.md')

describe('every exercise', () => {
  it('has how, cue, mistake and why', () => {
    const missing: string[] = []
    for (const e of plan.exercises) {
      for (const k of ['how', 'cue', 'mistake', 'why'] as const) {
        if (e[k].trim() === '') missing.push(`${e.id}.${k}`)
      }
    }
    expect(missing).toEqual([])
  })

  it('has its why in the plan: a session table row or the appendix why table', () => {
    const whyTable = new Map<string, string>()
    const start = doc.indexOf('### Why, for the other exercises')
    expect(start).toBeGreaterThan(0)
    for (const line of doc.slice(start, doc.indexOf('**Videos.**', start)).split('\n')) {
      if (!line.startsWith('| ') || line.startsWith('| Exercise |')) continue
      const [name = '', why = ''] = line.slice(2, -2).split(' | ')
      whyTable.set(name, why)
    }
    const byName = new Map(plan.exercises.map((e) => [e.name, e]))
    expect(whyTable.size).toBe(44)
    for (const [name, why] of whyTable) expect(byName.get(name)?.why, name).toBe(why)
    // The rest take theirs from a session table's "Why" column; tests/content/verbatim.test.ts finds each one there.
  })

  it('either has a link or is listed as having none, never both', () => {
    const ids = plan.exercises.map((e) => e.id)
    const linked = Object.keys(videos)
    expect([...linked, ...noLinkFound].sort()).toEqual([...ids].sort())
    expect(linked.filter((id) => noLinkFound.includes(id))).toEqual([])
    for (const e of plan.exercises) expect(!!e.video, e.id).toBe(e.id in videos)
  })
})

describe('teaching links', () => {
  const links = plan.exercises.flatMap((e) => (e.video ? [{ id: e.id, ...e.video }] : []))
  const today = new Date().toISOString().slice(0, 10)

  it('number 48, ten of them for the handstand drills', () => {
    expect(links.length).toBe(48)
    expect(links.filter((l) => plan.exercises.find((e) => e.id === l.id)?.area === 'handstand').length).toBe(
      10,
    )
  })

  it('are YouTube watch links or a health body’s https page, never an embed', () => {
    for (const l of links) {
      expect(l.url, l.id).toMatch(/^https:\/\//)
      expect(l.url, l.id).not.toMatch(/embed|youtu\.be|youtube-nocookie|shorts\//)
      const youtube = /^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/.test(l.url)
      const page = /^https:\/\/www\.nhs\.uk\/[\w/-]+\/$/.test(l.url)
      expect(youtube || page, l.id).toBe(true)
    }
  })

  it('carry a title, a channel and the day they were checked', () => {
    for (const l of links) {
      expect(l.title.trim(), l.id).not.toBe('')
      expect(l.channel.trim(), l.id).not.toBe('')
      expect(l.title, l.id).toBe(l.title.replace(/^\s+|\s+$/g, ''))
      expect(l.checked, l.id).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(Number.isNaN(Date.parse(l.checked)), l.id).toBe(false)
      expect(l.checked <= today, l.id).toBe(true)
    }
  })

  it('name each health body or coach the plan’s video paragraph promises', () => {
    const channels = new Set(links.map((l) => l.channel))
    for (const c of [
      'Royal Osteoporosis Society',
      'National Institute on Aging',
      'Hospital for Special Surgery',
      'NHS',
    ])
      expect(channels.has(c), c).toBe(true)
  })
})

describe('sources shown on exercise pages', () => {
  const ids = new Set(plan.sources.map((s) => s.id))

  it('are all defined, for exercises, ladders and levels', () => {
    const cited = [
      ...plan.exercises.flatMap((e) => e.sources),
      ...plan.ladders.flatMap((l) => [...l.sources, ...l.levels.flatMap((lv) => lv.sources)]),
    ]
    expect(cited.filter((id) => !ids.has(id))).toEqual([])
  })

  it('have a citation, an https link and a finding', () => {
    for (const s of plan.sources) {
      expect(s.url, s.id).toMatch(/^https:\/\//)
      expect(s.finding.length, s.id).toBeGreaterThan(10)
    }
  })
})
