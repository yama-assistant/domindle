import { countdownTo, mergeGuess } from './game'

describe('countdownTo', () => {
  it.each([
    ['2026-10-20T00:00:00Z', '23:59:59'],
    ['2026-10-20T00:00:00.500Z', '23:59:59'],
    ['2026-10-20T12:34:56Z', '11:25:04'],
    ['2026-10-20T23:59:59Z', '00:00:01'],
    ['2026-10-20T23:59:59.999Z', '00:00:00'],
  ])('at %s reads %s', (iso, expected) => {
    expect(countdownTo(new Date(iso))).toBe(expected)
  })
})

describe('mergeGuess', () => {
  it('appends the new Guess when nothing else was saved', () => {
    expect(mergeGuess([], ['x'], 'y', 'ans')).toEqual(['x', 'y'])
  })

  it('puts stored Guesses first, then this tab\'s unsaved ones, then the new Guess', () => {
    expect(mergeGuess(['s1', 's2'], ['s1', 'm1'], 'n', 'ans')).toEqual(['s1', 's2', 'm1', 'n'])
  })

  it('drops duplicates', () => {
    expect(mergeGuess(['a', 'b'], ['b', 'a'], 'a', 'ans')).toEqual(['a', 'b'])
  })

  it('adopts a stored game that already holds the Answer, dropping this tab\'s Guesses', () => {
    expect(mergeGuess(['s1', 'ans'], ['m1', 'm2'], 'n', 'ans')).toEqual(['s1', 'ans'])
  })

  it('keeps the in-memory Guesses when nothing could be read', () => {
    expect(mergeGuess([], ['m1', 'm2'], 'n', 'ans')).toEqual(['m1', 'm2', 'n'])
  })
})
