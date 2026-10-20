import { type KeyValueStorage, loadGuesses, loadHistory, recordSolved, safeStorage, saveGuesses } from './storage'

function fakeStorage(initial: Record<string, string> = {}): KeyValueStorage {
  const data = new Map(Object.entries(initial))
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) }
}
const throwing: KeyValueStorage = {
  getItem: () => {
    throw new Error('denied')
  },
  setItem: () => {
    throw new Error('denied')
  },
}

describe('History', () => {
  it('keeps the first Score for a Day recorded twice', () => {
    const storage = fakeStorage()
    recordSolved(storage, '2026-10-19', 2)
    recordSolved(storage, '2026-10-19', 5)
    expect(loadHistory(storage)).toEqual([{ day: '2026-10-19', score: 2 }])
  })

  it.each(['not json', '{"a":1}', '[1,null,{"day":3,"score":"x"}]', 'null'])('is empty for corrupt data %s', (raw) => {
    expect(loadHistory(fakeStorage({ 'domindle.art.history': raw }))).toEqual([])
  })

  it('skips unreadable entries and keeps the valid ones', () => {
    const raw = JSON.stringify([{ day: '2026-10-19', score: 1 }, { day: 7 }])
    expect(loadHistory(fakeStorage({ 'domindle.art.history': raw }))).toEqual([{ day: '2026-10-19', score: 1 }])
  })

  it('works through missing or throwing storage without errors', () => {
    for (const backend of [undefined, throwing]) {
      const storage = safeStorage(backend)
      expect(() => recordSolved(storage, '2026-10-19', 1)).not.toThrow()
      expect(loadHistory(storage)).toEqual([])
    }
  })
})

describe('saved game', () => {
  it('is empty for corrupt or wrong-shape data', () => {
    for (const raw of ['not json', '{"day":"2026-10-19"}', '{"day":"2026-10-19","guesses":"x"}', '42']) {
      expect(loadGuesses(fakeStorage({ 'domindle.art.game': raw }), '2026-10-19')).toEqual([])
    }
  })

  it('round-trips for the same Day only', () => {
    const storage = fakeStorage()
    saveGuesses(storage, '2026-10-19', ['a1', 'b2'])
    expect(loadGuesses(storage, '2026-10-19')).toEqual(['a1', 'b2'])
    expect(loadGuesses(storage, '2026-10-20')).toEqual([])
    expect(loadGuesses(storage, '2026-10-19')).toEqual([])
  })
})
