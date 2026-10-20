/** The small slice of Web Storage the game needs; a global backend can replace it later. */
export type KeyValueStorage = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

/** Wraps storage so that missing or throwing storage still gives a playable session. */
export function safeStorage(storage: KeyValueStorage | undefined): KeyValueStorage {
  return {
    getItem(key) {
      try {
        return storage?.getItem(key) ?? null
      } catch {
        return null
      }
    },
    setItem(key, value) {
      try {
        storage?.setItem(key, value)
      } catch {
        // Playing without persistence is fine.
      }
    },
  }
}

const GAME_KEY = 'domindle.art.game'
const HISTORY_KEY = 'domindle.art.history'

/** Parsed JSON stored under a key, or undefined when absent, unreadable or corrupt. */
function readJson(storage: KeyValueStorage, key: string): unknown {
  try {
    return JSON.parse(storage.getItem(key) ?? 'null') ?? undefined
  } catch {
    return undefined
  }
}

/** The Guesses (Card IDs) saved for a Day. A game saved for any other Day is over, so it is cleared. */
export function loadGuesses(storage: KeyValueStorage, day: string): string[] {
  const saved = readJson(storage, GAME_KEY) as { day?: string; guesses?: unknown } | undefined
  if (!saved) return []
  if (saved.day === day && Array.isArray(saved.guesses)) return saved.guesses.filter((g) => typeof g === 'string')
  // The interface has no removeItem, so a cleared game is stored as JSON null.
  storage.setItem(GAME_KEY, 'null')
  return []
}

export function saveGuesses(storage: KeyValueStorage, day: string, guesses: string[]) {
  storage.setItem(GAME_KEY, JSON.stringify({ day, guesses }))
}

/** A solved Day: the Score the player got on it. */
export type HistoryEntry = { day: string; score: number }

/** The History: every solved Day, oldest first, for later stats. Unreadable entries are skipped. */
export function loadHistory(storage: KeyValueStorage): HistoryEntry[] {
  const saved = readJson(storage, HISTORY_KEY)
  if (!Array.isArray(saved)) return []
  return saved.filter((e) => typeof e?.day === 'string' && Number.isInteger(e.score))
}

/** Records a solved Day; a Day already in the History is left as it was. */
export function recordSolved(storage: KeyValueStorage, day: string, score: number) {
  const history = loadHistory(storage)
  if (history.some((e) => e.day === day)) return
  storage.setItem(HISTORY_KEY, JSON.stringify([...history, { day, score }]))
}
