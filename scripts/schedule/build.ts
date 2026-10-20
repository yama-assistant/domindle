import type { AnswerSchedule, Catalog, Day } from '../../src/game.ts'

/** The Schedule is kept at least this many Days past today. */
export const MIN_FUTURE_DAYS = 365

const MS_PER_DAY = 86_400_000

export type BuildInput = {
  /** The committed Schedule, or undefined on the very first build. */
  schedule: AnswerSchedule | undefined
  catalog: Catalog
  /** Today's UTC Day: Days up to and including it are past and never assigned. */
  today: Day
  /** Day 0, used only when there is no Schedule yet. */
  launch: Day
  /** Returns a number in [0, 1). */
  random?: () => number
}

function shuffled<T>(items: T[], random: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Extends the Answer Schedule so at least MIN_FUTURE_DAYS Days after today are covered.
 * Existing entries are kept as they are; new entries only ever go on the end.
 */
export function buildSchedule({ schedule, catalog, today, launch, random = Math.random }: BuildInput): AnswerSchedule {
  const launchDay = schedule?.launch ?? launch
  const existing = schedule?.answerIds ?? []
  const pool = catalog.filter((c) => c.answer).map((c) => c.id)
  if (pool.length === 0) throw new Error('The Catalog has no Answers to schedule')

  const todayIndex = Math.round((Date.parse(today) - Date.parse(launchDay)) / MS_PER_DAY)
  if (existing.length > 0 && existing.length <= todayIndex) {
    throw new Error(
      `The Schedule ends on day ${existing.length - 1} but today is day ${todayIndex}: ` +
        `extending it would assign Answers to past Days`,
    )
  }

  // The current cycle is the run of entries since the first repeat; Cards used in it are spent.
  let spent = new Set<string>()
  for (const id of existing) {
    if (spent.has(id)) spent = new Set()
    spent.add(id)
  }

  const answerIds = [...existing]
  const target = Math.max(todayIndex + 1, 0) + MIN_FUTURE_DAYS
  let remaining = shuffled(
    pool.filter((id) => !spent.has(id)),
    random,
  )
  while (answerIds.length < target) {
    if (remaining.length === 0) remaining = shuffled(pool, random)
    answerIds.push(...remaining.splice(0, target - answerIds.length))
  }
  return { launch: launchDay, answerIds }
}

/** How many Days after today the Schedule covers. */
export function futureDays(schedule: AnswerSchedule, today: Day): number {
  const todayIndex = Math.round((Date.parse(today) - Date.parse(schedule.launch)) / MS_PER_DAY)
  return schedule.answerIds.length - 1 - todayIndex
}
