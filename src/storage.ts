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
  } catch {
    // Corrupt data: start fresh.
  }
  return []
}

export function saveGuesses(storage: KeyValueStorage, day: string, guesses: string[]) {
  storage.setItem(GAME_KEY, JSON.stringify({ day, guesses }))
}
