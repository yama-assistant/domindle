import type { Day } from './game'
import type { HistoryEntry } from './storage'

export type Stats = {
  played: number
  streak: number
  bestStreak: number
  /** Mean Score, or undefined when no Day has been solved. */
  averageScore: number | undefined
  /** Days solved with each Score; index 0 is Score 1. Scores past the last bucket count in it. */
  histogram: number[]
}

/** Histogram buckets; the last one also holds every higher Score. */
export const HISTOGRAM_BUCKETS = 8

const MS_PER_DAY = 86_400_000
const dayNumber = (day: Day) => Math.round(Date.parse(day) / MS_PER_DAY)

/**
 * Stats from the History. The current Streak is still alive if the latest solved Day is today
 * or yesterday (today can still be solved); any earlier gap has reset it.
 */
export function computeStats(history: HistoryEntry[], today: Day): Stats {
  const days = [...new Set(history.map((e) => dayNumber(e.day)))].sort((a, b) => a - b)
  let bestStreak = 0
  let run = 0
  days.forEach((d, i) => {
    run = i > 0 && d === days[i - 1] + 1 ? run + 1 : 1
    bestStreak = Math.max(bestStreak, run)
  })
  const alive = days.length > 0 && days[days.length - 1] >= dayNumber(today) - 1
  const histogram = Array<number>(HISTOGRAM_BUCKETS).fill(0)
  for (const { score } of history) histogram[Math.min(score, HISTOGRAM_BUCKETS) - 1]++
  return {
    played: history.length,
    streak: alive ? run : 0,
    bestStreak,
    averageScore: history.length ? history.reduce((sum, e) => sum + e.score, 0) / history.length : undefined,
    histogram,
  }
}
