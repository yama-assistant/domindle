export type CatalogEntry = { id: string; name: string; art: string }
export type Catalog = CatalogEntry[]
/** `launch` is the UTC date (YYYY-MM-DD) of day 0; `answers` are opaque Card IDs. */
export type Schedule = { launch: string; answers: string[] }

export const MAX_STEPS = 9
export const START_SCALE = 7

const MS_PER_DAY = 86_400_000

/** The UTC Day as YYYY-MM-DD. */
export const dayOf = (now: Date) => now.toISOString().slice(0, 10)

export function answerIdFor(schedule: Schedule, day: string): string {
  const index = Math.round((Date.parse(day) - Date.parse(schedule.launch)) / MS_PER_DAY)
  const n = schedule.answers.length
  return schedule.answers[((index % n) + n) % n]
}

export const scaleFor = (wrongGuesses: number) =>
  START_SCALE ** (1 - Math.min(wrongGuesses, MAX_STEPS) / MAX_STEPS)

/** A fully random point in 0..1 × 0..1, seeded by the Day. */
export function originFor(day: string): { x: number; y: number } {
  let h = 2166136261
  for (const c of day) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  const next = () => {
    h = (h + 0x6d2b79f5) | 0
    let t = Math.imul(h ^ (h >>> 15), 1 | h)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return { x: next(), y: next() }
}

export const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

export function suggestions(pool: Catalog, query: string, guessed: string[]): Catalog {
  const q = normalize(query)
  if (!q) return []
  return pool.filter((c) => !guessed.includes(c.id) && normalize(c.name).includes(q))
}
