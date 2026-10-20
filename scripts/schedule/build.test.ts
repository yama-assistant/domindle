// @vitest-environment node
import type { AnswerSchedule, Catalog } from '../../src/game.ts'
import { answerIdFor } from '../../src/game.ts'
import { buildSchedule, futureDays, MIN_FUTURE_DAYS } from './build.ts'

const card = (id: string, answer = true) => ({ id, name: id, answer, art: `${id}.webp` })
const catalogOf = (...ids: string[]): Catalog => ids.map((id) => card(id))
const LAUNCH = '2026-10-19'

/** A deterministic random source. */
function seeded(seed = 1) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const build = (over: Partial<Parameters<typeof buildSchedule>[0]> = {}) =>
  buildSchedule({ schedule: undefined, catalog: catalogOf('a', 'b', 'c'), today: LAUNCH, launch: LAUNCH, random: seeded(), ...over })

describe('the first build', () => {
  it('starts at the launch Day and covers a year of future Days', () => {
    const schedule = build()
    expect(schedule.launch).toBe(LAUNCH)
    expect(futureDays(schedule, LAUNCH)).toBeGreaterThanOrEqual(MIN_FUTURE_DAYS)
  })
})

describe('extending', () => {
  const existing: AnswerSchedule = { launch: LAUNCH, answerIds: ['c', 'a', 'b', 'a', 'c', 'b'] }

  it('never changes existing entries, even when rerun later', () => {
    const first = build({ schedule: existing, today: '2026-10-20' })
    expect(first.answerIds.slice(0, 6)).toEqual(existing.answerIds)
    const later = build({ schedule: first, today: '2026-12-01', random: seeded(7) })
    expect(later.answerIds.slice(0, first.answerIds.length)).toEqual(first.answerIds)
    expect(later.launch).toBe(LAUNCH)
  })

  it('is a no-op while the Schedule already covers enough Days', () => {
    const full = build()
    expect(build({ schedule: full })).toEqual(full)
  })

  it('shuffles Cards new to the Catalog into future Days only', () => {
    const base = build()
    const grown = build({ schedule: base, catalog: catalogOf('a', 'b', 'c', 'new'), today: '2026-10-25' })
    expect(grown.answerIds.slice(0, base.answerIds.length)).toEqual(base.answerIds)
    expect(base.answerIds).not.toContain('new')
    const index = grown.answerIds.indexOf('new')
    expect(index).toBeGreaterThanOrEqual(base.answerIds.length)
  })

  it('schedules a new Card before the next cycle, not after it', () => {
    const base: AnswerSchedule = { launch: LAUNCH, answerIds: ['a', 'b'] }
    const grown = build({ schedule: base, catalog: catalogOf('a', 'b', 'c', 'd') })
    expect(new Set(grown.answerIds.slice(2, 4))).toEqual(new Set(['c', 'd']))
  })
})

describe('cycles', () => {
  it('repeats no Card until every Card in the pool has been used', () => {
    const catalog = catalogOf('a', 'b', 'c', 'd', 'e')
    const { answerIds } = build({ catalog })
    expect(answerIds.length).toBeGreaterThan(5 * 3)
    for (let start = 0; start + 5 <= answerIds.length; start += 5)
      expect(new Set(answerIds.slice(start, start + 5))).toEqual(new Set(['a', 'b', 'c', 'd', 'e']))
  })

  it('continues a partly used cycle from where it stopped', () => {
    const base: AnswerSchedule = { launch: LAUNCH, answerIds: ['a', 'b', 'c', 'a'] }
    const { answerIds } = build({ schedule: base, catalog: catalogOf('a', 'b', 'c') })
    expect(new Set(answerIds.slice(4, 6))).toEqual(new Set(['b', 'c']))
    expect(new Set(answerIds.slice(6, 9))).toEqual(new Set(['a', 'b', 'c']))
  })
})

describe('what the Schedule holds', () => {
  it('holds only Card IDs of the Answer pool, and no names', () => {
    const catalog: Catalog = [card('a'), card('b'), card('gone', false)]
    const schedule = build({ catalog })
    expect(Object.keys(schedule).sort()).toEqual(['answerIds', 'launch'])
    expect(new Set(schedule.answerIds)).toEqual(new Set(['a', 'b']))
  })
})

describe('failing', () => {
  it('fails when the Schedule has run out before today', () => {
    const stale: AnswerSchedule = { launch: LAUNCH, answerIds: ['a', 'b'] }
    expect(() => build({ schedule: stale, today: '2026-10-25' })).toThrow(/past Days/)
  })

  it('fails when there are no Answers', () => {
    expect(() => build({ catalog: [card('x', false)] })).toThrow(/no Answers/)
  })

  it('reports fewer future Days than a year when the Schedule is short', () => {
    expect(futureDays({ launch: LAUNCH, answerIds: ['a', 'b', 'c'] }, LAUNCH)).toBe(2)
  })
})

describe('past Days', () => {
  it('still resolve when the Card later stops being an Answer', () => {
    const base = build()
    const day0 = answerIdFor(base, LAUNCH)!
    const catalog = catalogOf('a', 'b', 'c').map((c) => (c.id === day0 ? { ...c, answer: false } : c))
    const next = build({ schedule: base, catalog, today: '2026-11-01' })
    expect(answerIdFor(next, LAUNCH)).toBe(day0)
  })
})
