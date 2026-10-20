import { fakeStorage, throwingStorage as throwing } from './test/storage'
import { loadGuesses, loadHistory, recordSolved, safeStorage, saveGuesses } from './storage'

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

  it('ignores non-positive Scores', () => {
    const raw = JSON.stringify([{ day: '2026-10-19', score: 0 }, { day: '2026-10-20', score: -1 }])
    expect(loadHistory(fakeStorage({ 'domindle.art.history': raw }))).toEqual([])
  })

  it('works through missing or throwing storage without errors', () => {
    for (const backend of [undefined, throwing]) {
      const storage = safeStorage(backend)
      expect(() => recordSolved(storage, '2026-10-19', 1)).not.toThrow()
      expect(loadHistory(storage)).toEqual([])
    }
  })

  it('still attempts the write when storage throws', () => {
    const setItem = vi.fn(() => {
      throw new Error('denied')
    })
    recordSolved(safeStorage({ getItem: () => null, setItem }), '2026-10-19', 1)
    expect(setItem).toHaveBeenCalledOnce()
  })
})

describe('saved game', () => {
  it('is empty for corrupt or wrong-shape data', () => {
    for (const raw of ['not json', '{"day":"2026-10-19"}', '{"day":"2026-10-19","guesses":"x"}', '42']) {
      expect(loadGuesses(fakeStorage({ 'domindle.art.game': raw }), '2026-10-19')).toEqual([])
    }
  })

  it('round-trips for the same Day', () => {
    const storage = fakeStorage()
    saveGuesses(storage, '2026-10-19', ['a1', 'b2'])
    expect(loadGuesses(storage, '2026-10-19')).toEqual(['a1', 'b2'])
  })

  it('is cleared by loading a different Day', () => {
    const storage = fakeStorage()
    saveGuesses(storage, '2026-10-19', ['a1', 'b2'])
    expect(loadGuesses(storage, '2026-10-20')).toEqual([])
    expect(loadGuesses(storage, '2026-10-19')).toEqual([])
  })

  it('leaves unparseable data in place rather than clearing it', () => {
    const storage = fakeStorage({ 'domindle.art.game': 'not json' })
    loadGuesses(storage, '2026-10-19')
    expect(storage.getItem('domindle.art.game')).toBe('not json')
  })

  it.each(['0', '""', 'false'])('treats the falsy value %s as no saved game', (raw) => {
    expect(loadGuesses(fakeStorage({ 'domindle.art.game': raw }), '2026-10-19')).toEqual([])
  })

  it('does not throw when clearing fails', () => {
    const storage = {
      getItem: () => JSON.stringify({ day: '2026-10-19', guesses: ['a1'] }),
      setItem: () => {
        throw new Error('denied')
      },
    }
    expect(loadGuesses(storage, '2026-10-20')).toEqual([])
  })
})
