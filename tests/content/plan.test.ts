// The plan data's rules (design §7, docs/3-implementation.md Phase 1): it parses, ids are unique and references
// resolve, digits name a source or carry "our rule", every source is used, and the minutes per day match the plan.
import { describe, expect, it } from 'vitest'
import { EQUIPMENT, HOUSEHOLD } from '@/data/equipment'
import { NO_VIDEO } from '@/data/exercises'
import { exerciseById, ladderById, plan, planInput, sessionById } from '@/data/plan'
import { Plan, type Session, type StartRule, WEEKDAYS } from '@/data/schema'
import { definedSources, readRepoFile } from '../guard/repo'

const sourceIds = new Set(plan.sources.map((s) => s.id))

function duplicates(ids: string[]): string[] {
  return ids.filter((id, i) => ids.indexOf(id) !== i)
}

function session(id: string): Session {
  const s = sessionById.get(id)
  if (!s) throw new Error(`no session ${id}`)
  return s
}

function exerciseByName(name: string) {
  return plan.exercises.find((e) => e.name === name)
}

function ladderCodes(id: string): string[] {
  return (ladderById.get(id)?.levels ?? []).map((l) => l.code)
}

/** Every object in the plan, with its path, except the source list itself. */
function* objects(): Generator<{ path: string; obj: Record<string, unknown>; inherited: boolean }> {
  function* walk(
    node: unknown,
    path: string,
    inherited: boolean,
  ): Generator<{ path: string; obj: Record<string, unknown>; inherited: boolean }> {
    if (Array.isArray(node)) {
      for (const [i, v] of node.entries()) yield* walk(v, `${path}[${i}]`, inherited)
    } else if (node && typeof node === 'object') {
      const obj = node as Record<string, unknown>
      yield { path, obj, inherited }
      const here = inherited || covered(obj)
      // A teaching link's title and channel are names, not claims (they may hold digits: "Stage 2").
      for (const [k, v] of Object.entries(obj))
        if (k !== 'sources' && k !== 'video') yield* walk(v, `${path}.${k}`, here)
    }
  }
  // The plan's own `ourRule: true` covers the plan as a whole; counting it here would make the rule pass for every
  // object, so each part must carry its own flag or sources.
  for (const [k, v] of Object.entries(plan)) if (k !== 'sources') yield* walk(v, k, false)
}

function covered(obj: Record<string, unknown>): boolean {
  return obj.ourRule === true || (Array.isArray(obj.sources) && obj.sources.length > 0)
}

describe('the plan', () => {
  it('parses with the schema', () => {
    const result = Plan.safeParse(planInput)
    expect(result.success ? [] : result.error.issues).toEqual([])
  })

  it('has unique ids within each kind', () => {
    expect(duplicates(plan.sources.map((s) => s.id))).toEqual([])
    expect(duplicates(plan.exercises.map((e) => e.id))).toEqual([])
    expect(duplicates(plan.ladders.map((l) => l.id))).toEqual([])
    expect(duplicates(plan.sessions.map((s) => s.id))).toEqual([])
    expect(duplicates(plan.milestones.map((m) => m.id))).toEqual([])
    expect(duplicates(plan.rationale.map((r) => r.id))).toEqual([])
  })

  it('has unique step ids within each session', () => {
    for (const s of plan.sessions) expect(duplicates(s.steps.map((st) => st.id)), s.id).toEqual([])
  })

  it('numbers ladder levels 1..n with unique codes', () => {
    for (const l of plan.ladders) {
      expect(
        l.levels.map((lv) => lv.level),
        l.id,
      ).toEqual(l.levels.map((_, i) => i + 1))
      expect(duplicates(l.levels.map((lv) => lv.code)), l.id).toEqual([])
    }
  })
})

describe('references', () => {
  it('from steps resolve', () => {
    const bad: string[] = []
    for (const s of plan.sessions) {
      for (const st of s.steps) {
        if (st.ladderId && !ladderById.has(st.ladderId)) bad.push(`${s.id}.${st.id}: ${st.ladderId}`)
        if (st.exerciseId && !exerciseById.has(st.exerciseId)) bad.push(`${s.id}.${st.id}: ${st.exerciseId}`)
        if (st.pairedWith) {
          const other = s.steps.find((o) => o.id === st.pairedWith)
          if (other?.pairedWith !== st.id) bad.push(`${s.id}.${st.id}: pairedWith ${st.pairedWith}`)
        }
      }
    }
    expect(bad).toEqual([])
  })

  it('from ladder levels resolve', () => {
    const bad = plan.ladders.flatMap((l) =>
      l.levels.filter((lv) => !exerciseById.has(lv.exerciseId)).map((lv) => `${l.id} ${lv.code}`),
    )
    expect(bad).toEqual([])
  })

  it('from the week template resolve to sessions of the right kind', () => {
    for (const day of WEEKDAYS) {
      const d = plan.week[day]
      expect(session(d.morning).kind, day).toBe('morning')
      expect(['morning', 'split']).not.toContain(session(d.main).kind)
      if (d.split !== null) expect(session(d.split).kind, day).toBe('split')
    }
  })

  it('from start rules resolve to ladders and their codes', () => {
    for (const r of plan.startRules) {
      expect(ladderById.has(r.ladderId), r.ladderId).toBe(true)
      for (const b of r.bands) expect(ladderCodes(r.ladderId), r.ladderId).toContain(b.code)
    }
  })

  it('leave no ladder unused and no added exercise unused', () => {
    const usedLadders = new Set(plan.sessions.flatMap((s) => s.steps.map((st) => st.ladderId)))
    expect(plan.ladders.map((l) => l.id).filter((id) => !usedLadders.has(id))).toEqual([])
    const usedExercises = new Set([
      ...plan.sessions.flatMap((s) => s.steps.map((st) => st.exerciseId)),
      ...plan.ladders.flatMap((l) => l.levels.map((lv) => lv.exerciseId)),
    ])
    expect(plan.exercises.filter((e) => !usedExercises.has(e.id)).map((e) => e.id)).toEqual([])
  })
})

describe('sources', () => {
  it('match docs/sources.md exactly', () => {
    expect(plan.sources.map((s) => s.id)).toEqual(definedSources())
  })

  it('copy the citation, link and finding of docs/sources.md verbatim', () => {
    const doc = readRepoFile('docs/sources.md')
    for (const s of plan.sources) {
      expect(doc, s.id).toContain(`| ${s.id} | ${s.citation} <${s.url}> | ${s.finding} |`)
    }
  })

  it('cited in the data all exist', () => {
    const unknown: string[] = []
    for (const { path, obj } of objects()) {
      for (const id of (obj.sources as string[] | undefined) ?? [])
        if (!sourceIds.has(id)) unknown.push(`${path}: ${id}`)
    }
    expect(unknown).toEqual([])
  })

  it('are each used in the data outside the source list', () => {
    const used = new Set<string>()
    for (const { obj } of objects())
      for (const id of (obj.sources as string[] | undefined) ?? []) used.add(id)
    expect(plan.sources.map((s) => s.id).filter((id) => !used.has(id))).toEqual([])
  })

  it('cited in brackets in a text are in the same object’s sources', () => {
    const bad: string[] = []
    for (const { path, obj } of objects()) {
      const own = new Set((obj.sources as string[] | undefined) ?? [])
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v !== 'string') continue
        for (const m of v.matchAll(/\[([a-z][a-z0-9]*)\]/g)) {
          const id = m[1] ?? ''
          if (sourceIds.has(id) && !own.has(id)) bad.push(`${path}.${k}: ${id}`)
        }
      }
    }
    expect(bad).toEqual([])
  })
})

describe('the evidence rule (D-018)', () => {
  // Keys that hold ids, labels and references, not claims.
  const IGNORED = new Set([
    'id',
    'code',
    'exerciseId',
    'ladderId',
    'pairedWith',
    'label',
    'url',
    'version',
    'section',
  ])

  it('gives every text with a digit a source or "our rule", on itself or an enclosing object', () => {
    const bad: string[] = []
    for (const { path, obj, inherited } of objects()) {
      // An exercise is a name and a video (D-056): "90/90 switch" names a position, it claims nothing.
      if (inherited || covered(obj) || path.startsWith('exercises[')) continue
      for (const [k, v] of Object.entries(obj)) {
        if (!IGNORED.has(k) && typeof v === 'string' && /\d/.test(v)) bad.push(`${path}.${k}: ${v}`)
      }
    }
    expect(bad).toEqual([])
  })

  it('gives every "why" with a digit its own source or "our rule"', () => {
    const bad: string[] = []
    for (const { path, obj } of objects()) {
      if (typeof obj.why === 'string' && /\d/.test(obj.why) && !covered(obj)) bad.push(`${path}.why`)
    }
    expect(bad).toEqual([])
  })

  it('catches a digit without a source (the rule itself)', () => {
    expect(covered({ target: '8,000', sources: [] })).toBe(false)
    expect(covered({ target: '8,000', ourRule: true })).toBe(true)
  })
})

describe('minutes', () => {
  const mid = (r: { min: number; max: number }) => (r.min + r.max) / 2

  it('per day lie within the week table, allowing 5 min for its "~"', () => {
    for (const day of WEEKDAYS) {
      const d = plan.week[day]
      const parts = [session(d.morning), session(d.main), ...(d.split ? [session(d.split)] : [])]
      const total = {
        min: parts.reduce((a, s) => a + s.minutes.min, 0),
        max: parts.reduce((a, s) => a + s.minutes.max, 0),
      }
      expect(mid(total), day).toBeGreaterThanOrEqual(d.expectedMinutes.min - 5)
      expect(mid(total), day).toBeLessThanOrEqual(d.expectedMinutes.max + 5)
    }
  })

  it('per pillar add up to the middle of each session', () => {
    for (const s of plan.sessions) {
      const sum = Object.values(s.pillars).reduce((a, n) => a + n, 0)
      expect(sum, s.id).toBe(mid(s.minutes))
    }
  })
})

/** The rows of the plan's Appendix A tables: an exercise's name and its video link. */
function appendixRows(): { name: string; url?: string }[] {
  const text = readRepoFile('docs/2-exercise-plan.md')
  const appendix = text.slice(text.indexOf('## Appendix A'))
  const rows: { name: string; url?: string }[] = []
  for (const line of appendix.split('\n')) {
    const m = /^\| ([^|]+?) \| \[[^\]]+\]\((https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11})\) \|$/.exec(line)
    if (m) rows.push({ name: m[1] as string, url: m[2] as string })
    const none = /^\| ([^|]+?) \| None: everyone knows it \|$/.exec(line)
    if (none) rows.push({ name: none[1] as string })
  }
  return rows
}

describe('against the plan text', () => {
  it('has every exercise in Appendix A with its video, and nothing else (D-056)', () => {
    const rows = appendixRows()
    expect(rows.map((r) => r.name)).toEqual(plan.exercises.map((e) => e.name))
    for (const r of rows) expect(exerciseByName(r.name)?.video?.url, r.name).toBe(r.url)
  })

  it('gives every exercise a video except the everyday ones everyone knows (D-056)', () => {
    expect(plan.exercises.filter((e) => !e.video).map((e) => e.id)).toEqual([...NO_VIDEO])
  })

  it('has the ladders of §7 with their levels', () => {
    expect(ladderCodes('squat')).toEqual(['1', '2', '3', '4', '5'])
    expect(ladderById.get('squat')?.levels.at(-1)?.name).toMatch(/^Bulgarian split squat/)
    expect(ladderCodes('bridge')).toHaveLength(5)
    expect(ladderCodes('push')).toHaveLength(6)
    expect(ladderCodes('handstand-skill')).toEqual(Array.from({ length: 14 }, (_, i) => `H${i + 1}`))
    expect(ladderCodes('handstand-strength')).toEqual(['S1', 'S2', 'S3'])
    expect(ladderCodes('row')).toEqual(['P1', 'P2', 'P3'])
    expect(ladderCodes('back-extension')).toHaveLength(5)
    expect(ladderById.get('back-extension')?.sources).toContain('katzman2010')
    expect(ladderCodes('core')).toHaveLength(3)
    expect(ladderCodes('run')).toEqual(['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8'])
    expect(ladderById.get('rope')).toBeUndefined()
    expect(ladderCodes('jumps')).toHaveLength(3)
    expect(ladderCodes('grip')).toEqual(['G1', 'G2', 'G3', 'G4'])
    expect(ladderCodes('balance')).toEqual(['Ba1', 'Ba2', 'Ba3', 'Ba4', 'Ba5', 'Ba6'])
    for (const l of plan.ladders) expect(l.ourRule, l.id).toBe(true)
  })

  it('has the run steps as written', () => {
    const run = ladderById.get('run')?.levels ?? []
    expect(run[0]?.pass.repeats).toEqual({
      repeats: 8,
      workS: 60,
      restS: 120,
      workLabel: 'run',
      restLabel: 'walk',
    })
    expect(run[2]?.pass.repeats).toMatchObject({ repeats: 5, workS: 180, restS: 90 })
    expect(run[7]?.pass).toMatchObject({ minutes: 30 })
    expect(run[7]?.pass.repeats).toBeUndefined()
    expect(run[7]?.pass.text).toMatch(/^30 min continuous/)
  })

  it('has the interval stages of §6.7', () => {
    const stages = plan.blockRules.intervalStages
    expect(stages.map((s) => [s.stage, s.fromBlock])).toEqual([
      [1, 1],
      [2, 2],
      [3, 3],
      [4, 4],
    ])
    expect(stages[0]?.set).toMatchObject({ repeats: 10, workS: 30, restS: 60 })
    expect(stages[3]?.set).toMatchObject({ repeats: 4, workS: 240, restS: 180 })
    expect(stages[3]?.sources).toEqual(['helgerud2007'])
    const main = session('intervals').steps.filter((st) => st.intervalStage)
    expect(main).toHaveLength(1)
  })

  it('has the week of §5', () => {
    expect(plan.week.mon).toMatchObject({ main: 'strength-a', split: 'split-front' })
    expect(plan.week.tue).toMatchObject({ main: 'easy-run', split: 'split-side' })
    expect(plan.week.wed).toMatchObject({ main: 'strength-b', split: 'split-front' })
    expect(plan.week.thu).toMatchObject({ main: 'intervals', split: 'split-side' })
    expect(plan.week.fri).toMatchObject({ main: 'strength-c', split: 'split-short' })
    expect(plan.week.sat).toMatchObject({ main: 'long', split: 'split-short' })
    expect(plan.week.sun).toMatchObject({ main: 'light', split: null })
    for (const day of WEEKDAYS) expect(plan.week[day].morning).toBe('morning')
  })

  it('has the sessions of §6 in their shape', () => {
    expect(session('morning').steps.map((s) => s.label)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8'])
    for (const id of ['strength-a', 'strength-b', 'strength-c']) {
      const parts = session(id).steps.map((s) => s.part)
      expect(parts.slice(0, 3), id).toEqual(['warmup', 'warmup', 'warmup'])
      expect(parts[3], id).toBe('main')
      expect(session(id).minutes, id).toEqual({ min: 35, max: 35 })
    }
    expect(
      session('strength-a')
        .steps.map((s) => s.label)
        .slice(3),
    ).toEqual(['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
    expect(session('strength-a').steps.find((s) => s.id === 'a1')?.restS).toBeUndefined()
    expect(session('strength-a').steps.find((s) => s.id === 'a2')?.restS).toBe(75)
    expect(session('easy-run').minutes).toEqual({ min: 38, max: 48 })
    expect(session('easy-run').steps.find((s) => s.id === 'indoor-walk')).toMatchObject({
      variant: 'indoor',
      exerciseId: 'walk',
      minutes: { min: 45, max: 60 },
    })
    for (const id of ['easy-run', 'intervals', 'long']) expect(session(id).hasVariants, id).toBe(true)
    const light = session('light')
    expect(light.minutes).toEqual({ min: 30, max: 30 })
    expect(light.steps[0]).toMatchObject({ exerciseId: 'walk', part: 'warmup' })
    expect(light.steps[0]?.minutes).toBeUndefined()
    for (const id of ['split-front', 'split-side', 'split-short']) {
      expect(session(id).minutes, id).toEqual({ min: 10, max: 10 })
    }
    for (const s of plan.sessions) expect(s.ourRule, s.id).toBe(true)
  })

  it('has the milestones of §11, the ability ones read from ladder levels (D-067)', () => {
    const ids = plan.milestones.map((m) => m.id)
    expect(ids).toContain('hatchling')
    expect(ids).toContain('ancient')
    expect(plan.milestones.find((m) => m.id === 'handstand-13')).toMatchObject({
      kind: 'level',
      ladderId: 'handstand-skill',
      threshold: 13,
    })
    for (const m of plan.milestones) expect(m.ourRule, m.id).toBe(true)
  })
})

describe('start rules', () => {
  // A band matches when min ≤ v and (max is null or v < max); the highest matching level wins (schema.ts).
  function startCode(ladderId: string, inputs: Partial<Record<StartRule['input'], number>>): string {
    const codes = ladderCodes(ladderId)
    let best = codes[0] ?? ''
    for (const r of plan.startRules.filter((r) => r.ladderId === ladderId)) {
      const v = inputs[r.input]
      if (v === undefined) continue
      const band = r.bands.find((b) => b.min <= v && (b.max === null || v < b.max))
      if (band && codes.indexOf(band.code) > codes.indexOf(best)) best = band.code
    }
    return best
  }

  it('follow the table of §8 (D-069)', () => {
    expect([0, 4, 5, 14, 15, 29, 30, 60].map((n) => startCode('push', { pushups: n }))).toEqual([
      '1',
      '1',
      '2',
      '2',
      '3',
      '3',
      '4',
      '4',
    ])
    expect([0, 9.5, 10, 29, 30, 45].map((n) => startCode('run', { runMin: n }))).toEqual([
      'R1',
      'R1',
      'R4',
      'R4',
      'R8',
      'R8',
    ])
    expect([0, 1].map((n) => startCode('balance', { oneLeg30: n }))).toEqual(['Ba1', 'Ba2'])
    expect([0, 1].map((n) => startCode('handstand-skill', { handstandWall30: n }))).toEqual(['H1', 'H8'])
    for (const [ladder, code] of [
      ['squat', '2'],
      ['bridge', '2'],
      ['row', 'P2'],
      ['back-extension', '2'],
    ])
      expect(startCode(ladder as string, { trains: 1 }), ladder).toBe(code)
    expect(startCode('squat', { trains: 0 })).toBe('1')
  })
})

describe('the equipment (D-063)', () => {
  it('in Settings › About is the equipment the plan names, word for word', () => {
    const intro = readRepoFile('docs/2-exercise-plan.md').split('## Contents')[0]?.replace(/\n/g, ' ') ?? ''
    for (const e of EQUIPMENT) expect(intro, e).toContain(e.charAt(0).toLowerCase() + e.slice(1))
    for (const h of HOUSEHOLD) expect(intro, h).toContain(h)
    expect(EQUIPMENT).toHaveLength(3)
  })
})
