import { act, render, screen, within } from '@testing-library/preact'
import userEvent from '@testing-library/user-event'
import { App } from './App'
import type { AnswerSchedule, Catalog } from './game'
import type { KeyValueStorage } from './storage'

// Opaque IDs; names only appear in the catalog.
const catalog: Catalog = [
  { id: 'a1', name: 'Cellar', answer: true, art: 'a1.jpg' },
  { id: 'b2', name: 'Chapel', answer: true, art: 'b2.jpg' },
  { id: 'c3', name: 'Herb Gatherer', answer: true, art: 'c3.jpg' },
  { id: 'd4', name: 'Séance', answer: true, art: 'd4.jpg' },
  { id: 'e5', name: 'Market', answer: true, art: 'e5.jpg' },
  { id: 'f6', name: 'Mine', answer: true, art: 'f6.jpg' },
  { id: 'g7', name: 'Moat', answer: true, art: 'g7.jpg' },
  { id: 'h8', name: 'Village', answer: true, art: 'h8.jpg' },
  { id: 'i9', name: 'Witch', answer: true, art: 'i9.jpg' },
  { id: 'j10', name: 'Smithy', answer: true, art: 'j10.jpg' },
  { id: 'k11', name: 'Library', answer: true, art: 'k11.jpg' },
  { id: 'p0', name: 'Augurs', answer: false, art: 'p0.jpg' },
]
// day 0 = 2026-10-19 → Cellar, day 1 → Chapel, day 2 → Herb Gatherer
const schedule: AnswerSchedule = { launch: '2026-10-19', answerIds: ['a1', 'b2', 'c3', 'd4'] }

const at = (iso: string) => () => new Date(iso)

function fakeStorage(): KeyValueStorage {
  const data = new Map<string, string>()
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) }
}
const throwingStorage: KeyValueStorage = {
  getItem: () => {
    throw new Error('denied')
  },
  setItem: () => {
    throw new Error('denied')
  },
}

function setup(iso = '2026-10-19T12:00:00Z', storage: KeyValueStorage = fakeStorage()) {
  const user = userEvent.setup()
  const utils = render(<App catalog={catalog} schedule={schedule} now={at(iso)} storage={storage} artBase="/art/" />)
  const art = () => screen.getByRole('img', { name: /artwork/i }) as HTMLImageElement
  const input = () => screen.getByRole('combobox', { name: /guess the card/i })
  const guess = async (text: string) => {
    await user.clear(input())
    await user.type(input(), text)
    await user.keyboard('{Enter}')
  }
  const optionNames = () => within(screen.getByRole('listbox')).getAllByRole('option').map((o) => o.textContent)
  return { user, art, input, guess, optionNames, ...utils }
}

describe("today's Answer", () => {
  it('is picked by UTC Day, and changes at midnight UTC', async () => {
    const day0 = setup('2026-10-19T23:59:59Z')
    await day0.guess('Cellar')
    expect(screen.getByTestId('banner')).toHaveTextContent('Cellar')
    day0.unmount()

    const day1 = setup('2026-10-20T00:00:00Z')
    await day1.guess('Cellar')
    expect(screen.getByTestId('banner')).toHaveTextContent('Guess 2')
    await day1.guess('Chapel')
    expect(screen.getByTestId('banner')).toHaveTextContent('Chapel')
  })

  it('rolls over to the next Day in a tab left open past midnight UTC', () => {
    vi.useFakeTimers()
    try {
      let current = new Date('2026-10-19T23:59:58Z')
      const { art } = (() => {
        render(<App catalog={catalog} schedule={schedule} now={() => current} storage={fakeStorage()} artBase="/art/" />)
        return { art: () => screen.getByRole('img', { name: /artwork/i }) }
      })()
      expect(art().getAttribute('src')).toBe('/art/a1.jpg')
      current = new Date('2026-10-20T00:00:01Z')
      act(() => {
        vi.advanceTimersByTime(1000)
      })
      expect(art().getAttribute('src')).toBe('/art/b2.jpg')
      expect(screen.getByTestId('banner')).toHaveTextContent('Guess 1')
    } finally {
      vi.useRealTimers()
    }
  })

  it('uses opaque art file names', () => {
    const { art } = setup()
    expect(art().getAttribute('src')).toBe('/art/a1.jpg')
  })
})

describe('zoom', () => {
  it('starts at scale 7 with an origin that is the same on every reload that Day', () => {
    const first = setup()
    expect(first.art().style.transform).toBe('scale(7)')
    const origin = first.art().style.transformOrigin
    expect(origin).toMatch(/%/)
    first.unmount()
    expect(setup().art().style.transformOrigin).toBe(origin)
  })

  it('uses a different origin on a different Day', () => {
    const a = setup('2026-10-19T12:00:00Z')
    const origin = a.art().style.transformOrigin
    a.unmount()
    expect(setup('2026-10-20T12:00:00Z').art().style.transformOrigin).not.toBe(origin)
  })

  it('zooms out one step per wrong Guess and is fully out after 9', async () => {
    const { art, guess } = setup()
    const wrong = ['Chapel', 'Herb Gatherer', 'Séance', 'Market', 'Mine', 'Moat', 'Village', 'Witch', 'Smithy']
    const scales = [art().style.transform]
    for (const name of wrong) {
      await guess(name)
      scales.push(art().style.transform)
    }
    const values = scales.map((s) => Number(/scale\(([\d.]+)\)/.exec(s)![1]))
    expect(values[0]).toBe(7)
    expect(values[9]).toBe(1)
    for (let i = 1; i < values.length; i++) expect(values[i]).toBeLessThan(values[i - 1])
  })
})

describe('autocomplete', () => {
  it('matches substrings, ignoring case and accents', async () => {
    const { user, input, optionNames } = setup()
    await user.type(input(), 'gath')
    expect(optionNames()).toEqual(['Herb Gatherer'])
    await user.clear(input())
    await user.type(input(), 'SEANCE')
    expect(optionNames()).toEqual(['Séance'])
  })

  it('offers only Cards in the Answer pool', async () => {
    const { user, input } = setup()
    await user.type(input(), 'Augurs')
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })

  it('excludes Cards already Guessed', async () => {
    const { user, input, guess } = setup()
    await guess('Chapel')
    await user.type(input(), 'chap')
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })
})

describe('guessing', () => {
  it('submits with Enter or the button', async () => {
    const { user, input, guess } = setup()
    await guess('Chapel')
    await user.type(input(), 'Market')
    await user.click(screen.getByRole('button', { name: 'Guess' }))
    expect(screen.getByTestId('banner')).toHaveTextContent('Guess 3')
  })

  it('can pick a suggestion by clicking it', async () => {
    const { user, input } = setup()
    await user.type(input(), 'mo')
    await user.click(screen.getByRole('option', { name: 'Moat' }))
    expect(screen.getByTestId('banner')).toHaveTextContent('Guess 2')
  })

  it('lists wrong Guesses in red, newest first, and the banner shows the Guess number', async () => {
    const { guess } = setup()
    expect(screen.getByTestId('banner')).toHaveTextContent('Guess 1')
    await guess('Chapel')
    await guess('Market')
    const items = within(screen.getByRole('list', { name: 'Wrong guesses' })).getAllByRole('listitem')
    expect(items.map((i) => i.textContent)).toEqual(['Market', 'Chapel'])
    items.forEach((i) => expect(i).toHaveClass('wrong'))
    expect(screen.getByTestId('banner')).toHaveTextContent('Guess 3')
  })

  it('does not guess a partial name on Enter', async () => {
    const { guess } = setup()
    await guess('mo')
    expect(screen.getByTestId('banner')).toHaveTextContent('Guess 1')
  })

  it('ignores text that is not an Answer-pool Card', async () => {
    const { guess } = setup()
    await guess('Nonsense')
    expect(screen.getByTestId('banner')).toHaveTextContent('Guess 1')
  })
})

describe('winning', () => {
  it('shows the full art and the Card name, and disables the input', async () => {
    const { art, input, guess } = setup()
    await guess('Chapel')
    await guess('Cellar')
    expect(art().style.transform).toBe('scale(1)')
    expect(screen.getByTestId('banner')).toHaveTextContent('Cellar')
    expect(screen.getByTestId('banner')).not.toHaveTextContent('Guess')
    expect(input()).toBeDisabled()
  })
})

describe('sharing', () => {
  const stubClipboard = (writeText: (t: string) => Promise<void>) =>
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
  afterEach(() => vi.unstubAllGlobals())

  it('is not offered before winning', async () => {
    const { guess } = setup()
    await guess('Chapel')
    expect(screen.queryByRole('button', { name: 'Share' })).not.toBeInTheDocument()
  })

  it('copies the exact spoiler-free text and confirms', async () => {
    const writeText = vi.fn(async () => {})
    const { user, guess } = setup()
    stubClipboard(writeText)
    for (const name of ['Chapel', 'Market', 'Mine', 'Cellar']) await guess(name)
    await user.click(screen.getByRole('button', { name: 'Share' }))
    expect(writeText).toHaveBeenCalledWith('Domindle Art · 19 Oct 2026 🟥🟥🟥🟩 4 guesses')
    expect(screen.getByRole('status')).toHaveTextContent(/copied/i)
  })

  it('never includes the Card name', async () => {
    const writeText = vi.fn(async () => {})
    const { user, guess } = setup()
    stubClipboard(writeText)
    await guess('Cellar')
    await user.click(screen.getByRole('button', { name: 'Share' }))
    expect(writeText).toHaveBeenCalledWith('Domindle Art · 19 Oct 2026 🟩 1 guess')
  })

  it('tells the player when the clipboard is unavailable', async () => {
    const { user, guess } = setup()
    stubClipboard(async () => {
      throw new Error('denied')
    })
    await guess('Cellar')
    await user.click(screen.getByRole('button', { name: 'Share' }))
    expect(screen.getByRole('status')).toHaveTextContent(/couldn't copy/i)
  })
})

describe('persistence and the Schedule', () => {
  it('keeps today\'s Guesses across a reload', async () => {
    const storage = fakeStorage()
    const first = setup('2026-10-19T12:00:00Z', storage)
    await first.guess('Chapel')
    first.unmount()
    setup('2026-10-19T13:00:00Z', storage)
    expect(screen.getByTestId('banner')).toHaveTextContent('Guess 2')
    expect(screen.getByRole('listitem')).toHaveTextContent('Chapel')
  })

  it('starts fresh on a new Day', async () => {
    const storage = fakeStorage()
    const first = setup('2026-10-19T12:00:00Z', storage)
    await first.guess('Chapel')
    first.unmount()
    setup('2026-10-20T12:00:00Z', storage)
    expect(screen.getByTestId('banner')).toHaveTextContent('Guess 1')
  })

  it('is still playable when storage throws', async () => {
    const { guess } = setup('2026-10-19T12:00:00Z', throwingStorage)
    await guess('Chapel')
    expect(screen.getByTestId('banner')).toHaveTextContent('Guess 2')
  })

  it('says there is no puzzle when the Schedule does not cover the Day', () => {
    setup('2026-11-30T12:00:00Z')
    expect(screen.getByText(/no puzzle today/i)).toBeInTheDocument()
  })
})
