import { answerFor } from '../answer'
import { LAUNCH_DAY, shiftDay } from '../game'
import catalog from './catalog.json'

/** About ten years of Days from launch. */
const DAYS_CHECKED = 3650

describe('the committed Catalog', () => {
  it('has unique IDs and, among Answers, unique names', () => {
    expect(new Set(catalog.map((e) => e.id)).size).toBe(catalog.length)
    const answers = catalog.filter((e) => e.answer).map((e) => e.name)
    expect(new Set(answers).size).toBe(answers.length)
  })

  it('has at least one Card that can be an Answer', () => {
    expect(catalog.some((e) => e.answer)).toBe(true)
  })

  it('resolves every Card the Answer Formula picks over a long range of Days', () => {
    for (let i = 0; i < DAYS_CHECKED; i++) {
      const picked = answerFor(catalog, shiftDay(LAUNCH_DAY, i))
      expect(picked, `day ${i}`).toBeDefined()
      expect(catalog.find((e) => e.id === picked!.id)?.answer, picked!.id).toBe(true)
    }
  })

  it('never lets a Pile Placeholder, Landscape, Extra or Removed Card be an Answer', () => {
    for (const e of catalog)
      if (e.category !== 'Card' || e.removed) expect(e.answer, e.name).toBe(false)
  })
})
