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

/** Today's in-progress game: the Guesses (Card IDs) made on a Day. */
export function loadGuesses(storage: KeyValueStorage, day: string): string[] {
  try {
    const saved = JSON.parse(storage.getItem(GAME_KEY) ?? 'null')
    if (saved?.day === day && Array.isArray(saved.guesses)) return saved.guesses.filter((g: unknown) => typeof g === 'string')
    if (saved) storage.setItem(GAME_KEY, 'null') // A previous Day's game is over.
  } catch {
    // Corrupt data: start fresh.
  }
  return []
}

export function saveGuesses(storage: KeyValueStorage, day: string, guesses: string[]) {
  storage.setItem(GAME_KEY, JSON.stringify({ day, guesses }))
}

const HISTORY_KEY = 'domindle.art.history'

/** A finished Day: the Score the player got on it. */
export type HistoryEntry = { day: string; score: number }

/** Every finished Day, oldest first, for later stats. */
export function loadHistory(storage: KeyValueStorage): HistoryEntry[] {
  try {
    const saved = JSON.parse(storage.getItem(HISTORY_KEY) ?? '[]')
    if (Array.isArray(saved)) {
      return saved.filter((e) => typeof e?.day === 'string' && Number.isInteger(e.score))
    }
  } catch {
    // Corrupt data: treat as empty.
  }
  return []
}

/** Records a finished Day; a Day already in the history is left as it was. */
export function recordFinished(storage: KeyValueStorage, day: string, score: number) {
  const history = loadHistory(storage)
  if (history.some((e) => e.day === day)) return
  storage.setItem(HISTORY_KEY, JSON.stringify([...history, { day, score }]))
}
