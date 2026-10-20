import { dayIndex, dayOf } from '../game'
import catalog from './catalog.json'
import schedule from './schedule.json'

describe('the committed Catalog', () => {
  it('has unique IDs and, among Answers, unique names', () => {
    expect(new Set(catalog.map((e) => e.id)).size).toBe(catalog.length)
    const answers = catalog.filter((e) => e.answer).map((e) => e.name)
    expect(new Set(answers).size).toBe(answers.length)
  })

  it('keeps every scheduled Answer resolvable, and future ones guessable', () => {
    const today = dayOf(new Date())
    schedule.answerIds.forEach((id, i) => {
      const entry = catalog.find((e) => e.id === id)
      expect(entry, id).toBeDefined()
      if (i > dayIndex(schedule.launch, today)) expect(entry?.answer, id).toBe(true)
    })
  })

  it('starts the Schedule at launch with no Card repeated within the first cycle', () => {
    const days = schedule.answerIds.slice(0, catalog.filter((e) => e.answer).length)
    expect(new Set(days).size).toBe(days.length)
  })

  it('never lets a Pile Placeholder, Landscape, Extra or Removed Card be an Answer', () => {
    for (const e of catalog)
      if (e.category !== 'Card' || e.removed) expect(e.answer, e.name).toBe(false)
  })
})
