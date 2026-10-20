import { countdownTo, yesterdayAnswerIdFor } from './game'

describe('countdownTo', () => {
  it.each([
    ['2026-10-20T00:00:00Z', '23:59:59'],
    ['2026-10-20T00:00:00.500Z', '23:59:59'],
    ['2026-10-20T12:34:56Z', '11:25:04'],
    ['2026-10-20T23:59:59Z', '00:00:01'],
    ['2026-10-20T23:59:59.999Z', '00:00:00'],
  ])('at %s reads %s', (iso, expected) => {
    expect(countdownTo(new Date(iso))).toBe(expected)
  })
})

describe('yesterdayAnswerIdFor', () => {
  const schedule = { launch: '2026-10-19', answerIds: ['a', 'b', 'c'] }

  it('is the previous Day\'s Answer', () => {
    expect(yesterdayAnswerIdFor(schedule, '2026-10-21')).toBe('b')
  })

  it('is undefined on launch day', () => {
    expect(yesterdayAnswerIdFor(schedule, '2026-10-19')).toBeUndefined()
  })

  it('is undefined before launch', () => {
    expect(yesterdayAnswerIdFor(schedule, '2026-10-10')).toBeUndefined()
  })

  it('is undefined past the end of the Schedule', () => {
    expect(yesterdayAnswerIdFor(schedule, '2026-12-01')).toBeUndefined()
  })
})
