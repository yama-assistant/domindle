import { computeStats } from './stats'

const solved = (...days: string[]) => days.map((day) => ({ day, score: 2 }))

describe('computeStats', () => {
  it('resets the current Streak when a Day is missed, but keeps the best one', () => {
    const stats = computeStats(solved('2026-10-15', '2026-10-16', '2026-10-17'), '2026-10-19')
    expect(stats.streak).toBe(0)
    expect(stats.bestStreak).toBe(3)
  })

  it('keeps the Streak while today is still unsolved', () => {
    expect(computeStats(solved('2026-10-17', '2026-10-18'), '2026-10-19').streak).toBe(2)
  })

  it('counts a repeated Day once, keeping its first Score', () => {
    const stats = computeStats([{ day: '2026-10-19', score: 1 }, { day: '2026-10-19', score: 5 }], '2026-10-19')
    expect(stats.played).toBe(1)
    expect(stats.averageScore).toBe(1)
  })

  it('counts Scores past the last bucket in the last bucket', () => {
    const stats = computeStats([{ day: '2026-10-19', score: 30 }], '2026-10-19')
    expect(stats.histogram.at(-1)).toBe(1)
  })
})
