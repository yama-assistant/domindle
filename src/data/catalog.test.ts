import catalog from './catalog.json'
import schedule from './schedule.json'

describe('the committed Catalog', () => {
  it('has unique IDs and, among Answers, unique names', () => {
    expect(new Set(catalog.map((e) => e.id)).size).toBe(catalog.length)
    const answers = catalog.filter((e) => e.answer).map((e) => e.name)
    expect(new Set(answers).size).toBe(answers.length)
  })

  it('keeps every scheduled Answer resolvable as an Answer', () => {
    for (const id of schedule.answerIds) expect(catalog.find((e) => e.id === id)?.answer, id).toBe(true)
  })

  it('never lets a Pile Placeholder, Landscape, Extra or Removed Card be an Answer', () => {
    for (const e of catalog)
      if (e.category !== 'Card' || e.removed) expect(e.answer, e.name).toBe(false)
  })
})
