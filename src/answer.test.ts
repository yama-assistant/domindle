import { answerFor } from './answer'
import { dayOf, shiftDay, type Catalog } from './game'

const card = (id: string, answer = true) => ({ id, name: id, answer, art: `${id}.webp` })
const pool = (n: number): Catalog => Array.from({ length: n }, (_, i) => card(`card${i}`))
const START = '2026-01-01'
const days = (n: number) => Array.from({ length: n }, (_, i) => shiftDay(START, i))

describe('answerFor', () => {
  it('gives the same Answer for the same Catalog and Day', () => {
    for (const day of days(50)) expect(answerFor(pool(20), day)).toEqual(answerFor(pool(20), day))
  })

  it('only ever picks Cards that can be Answers', () => {
    const catalog = [...pool(10), card('removed', false), card('landscape', false), card('pp', false)]
    for (const day of days(500)) expect(answerFor(catalog, day)?.answer).toBe(true)
  })

  it('never repeats the previous Day\'s Answer', () => {
    const catalog = pool(200)
    for (const day of days(365)) expect(answerFor(catalog, day)).not.toBe(answerFor(catalog, shiftDay(day, -1)))
  })

  it('allows a repeat when the pool has a single Card', () => {
    const catalog = [card('only'), card('removed', false)]
    for (const day of days(20)) expect(answerFor(catalog, day)?.id).toBe('only')
  })

  it('gives no Answer when no Card can be one', () => {
    expect(answerFor([card('removed', false)], START)).toBeUndefined()
    expect(answerFor([], START)).toBeUndefined()
  })

  it('does not depend on the Catalog\'s order', () => {
    const catalog = pool(30)
    const reversed = [...catalog].reverse()
    const shuffled = [...catalog.filter((_, i) => i % 2 === 0), ...catalog.filter((_, i) => i % 2 === 1)]
    for (const day of days(200)) {
      expect(answerFor(reversed, day)?.id).toBe(answerFor(catalog, day)?.id)
      expect(answerFor(shuffled, day)?.id).toBe(answerFor(catalog, day)?.id)
    }
  })

  it.each([
    ['adding', (c: Catalog) => [...c, card('extra')]],
    ['removing', (c: Catalog) => c.slice(1)],
  ])('changes only roughly 1/N of Days when %s a Card', (_, change) => {
    const n = 50
    const catalog = pool(n)
    const changed = change(catalog)
    const range = days(3000)
    const differing = range.filter((d) => answerFor(catalog, d)?.id !== answerFor(changed, d)?.id).length
    // A Card wins ~1/N of Days, and each win shifts the next Day's exclusion too: allow generous slack around 2/N.
    expect(differing / range.length).toBeLessThan(4 / n)
    expect(differing).toBeGreaterThan(0)
  })

  it('spreads Answers across the pool', () => {
    const catalog = pool(20)
    const seen = new Set(days(1000).map((d) => answerFor(catalog, d)?.id))
    expect(seen.size).toBe(20)
  })

  it('works with real dates', () => {
    expect(answerFor(pool(5), dayOf(new Date('2026-10-20T12:00:00Z')))).toBeDefined()
  })
})
