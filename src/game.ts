/** `answer` is whether the entry can be an Answer (and so a Guess). */
export type CatalogEntry = { id: string; name: string; answer: boolean; art: string }
export type Catalog = CatalogEntry[]
/** A Day: a UTC calendar date as YYYY-MM-DD. */
export type Day = string

/** The first Day with a Daily Puzzle. */
export const LAUNCH_DAY: Day = '2026-10-19'

/** Wrong Guesses after which the art is fully zoomed out. */
export const MAX_STEPS = 9
export const START_SCALE = 7

const MS_PER_DAY = 86_400_000

/** The UTC Day as YYYY-MM-DD. */
export const dayOf = (now: Date): Day => now.toISOString().slice(0, 10)

/** The Day's position on a single running count of Days, so Days can be compared and differenced. */
export const dayNumber = (day: Day): number => Math.round(Date.parse(day) / MS_PER_DAY)

/** The Day `offset` days after `day` (negative for earlier). */
export const shiftDay = (day: Day, offset: number): Day => dayOf(new Date(Date.parse(day) + offset * MS_PER_DAY))

/** The time left until midnight UTC as HH:MM:SS; a full Day left (the first instant of a Day) reads 23:59:59, never 24:00:00. */
export function countdownTo(now: Date): string {
  const secondsLeft = Math.floor((Date.parse(shiftDay(dayOf(now), 1)) - now.getTime()) / 1000)
  const seconds = Math.min(secondsLeft, MS_PER_DAY / 1000 - 1)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}`
}

export const scaleFor = (wrongGuesses: number) =>
  START_SCALE ** (1 - Math.min(wrongGuesses, MAX_STEPS) / MAX_STEPS)

/** A fully random point in 0..1 × 0..1, seeded by the Day. */
export function originFor(day: Day): { x: number; y: number } {
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

/** Answer-pool Cards matching the typed text and not yet Guessed. */
export function suggestions(catalog: Catalog, query: string, guessedIds: string[]): Catalog {
  const q = normalize(query)
  if (!q) return []
  return catalog.filter((c) => c.answer && !guessedIds.includes(c.id) && normalize(c.name).includes(q))
}

/** The Card a submitted text names exactly (ignoring case and accents), if it can be Guessed. */
export function resolveTyped(options: Catalog, query: string): CatalogEntry | undefined {
  return options.find((c) => normalize(c.name) === normalize(query))
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** The spoiler-free result: the Day, one red square per wrong Guess, a green one, and the Score. */
export function shareText(day: Day, guesses: number, title = 'Domindle Art'): string {
  const [y, m, d] = day.split('-').map(Number)
  const squares = '🟥'.repeat(guesses - 1) + '🟩'
  return `${title} · ${d} ${MONTHS[m - 1]} ${y} ${squares} ${guesses} ${guesses === 1 ? 'guess' : 'guesses'}`
}

/**
 * The Guesses to save when a tab makes `newGuess`, given what is already saved and what this tab holds.
 * A saved game that already holds the Answer wins as-is (another tab solved the Day), so the new Guess is dropped.
 * Otherwise: saved Guesses first, then this tab's unsaved ones, then the new Guess, without duplicates.
 */
export function mergeGuess(stored: string[], inMemory: string[], newGuess: string, answerId: string): string[] {
  if (stored.includes(answerId)) return stored
  return [...new Set([...stored, ...inMemory, newGuess])]
}
