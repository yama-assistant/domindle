/**
 * Extends src/data/schedule.json from the Catalog's Answer pool. Run with `npm run build:schedule`.
 * Append-only: see docs/adr/0001-append-only-answer-schedule.md. The rules are in schedule/build.ts.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dayOf, type AnswerSchedule, type Catalog, type Day } from '../src/game.ts'
import { buildSchedule, futureDays } from './schedule/build.ts'

/** Day 0. Only used when there is no Schedule yet; afterwards the Schedule's own launch Day stands. */
const LAUNCH: Day = '2026-10-19'

const path = new URL('../src/data/schedule.json', import.meta.url)
const catalog: Catalog = JSON.parse(readFileSync(new URL('../src/data/catalog.json', import.meta.url), 'utf8'))
const existing: AnswerSchedule | undefined = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : undefined

const today = dayOf(new Date())
const schedule = buildSchedule({ schedule: existing, catalog, today, launch: LAUNCH })

writeFileSync(path, JSON.stringify(schedule, null, 1) + '\n')
console.log(
  `${schedule.answerIds.length} Days from ${schedule.launch} (${existing?.answerIds.length ?? 0} kept, ` +
    `${schedule.answerIds.length - (existing?.answerIds.length ?? 0)} added), ${futureDays(schedule, today)} after today`,
)
