import { useEffect, useMemo, useState } from 'preact/hooks'
import {
  type AnswerSchedule,
  type Catalog,
  answerIdFor,
  countdownTo,
  dayOf,
  originFor,
  resolveTyped,
  scaleFor,
  shareText,
  suggestions,
  yesterdayAnswerIdFor,
} from './game'
import { type KeyValueStorage, loadGuesses, recordSolved, safeStorage, saveGuesses } from './storage'
import { text } from './text'
import './style.css'

type Props = {
  catalog: Catalog
  schedule: AnswerSchedule
  now: () => Date
  storage?: KeyValueStorage
  artBase: string
}

export function App({ catalog, schedule, now, storage, artBase }: Props) {
  const store = useMemo(() => safeStorage(storage), [storage])
  const [day, setDay] = useState(() => dayOf(now()))
  const [guessedIds, setGuessedIds] = useState(() => loadGuesses(store, day))
  const [query, setQuery] = useState('')
  const [shareStatus, setShareStatus] = useState<'copied' | 'failed'>()

  const [countdown, setCountdown] = useState(() => countdownTo(now()))

  useEffect(() => {
    const tick = setInterval(() => {
      const current = now()
      setCountdown(countdownTo(current))
      const today = dayOf(current)
      if (today === day) return
      setDay(today)
      setGuessedIds(loadGuesses(store, today))
      setQuery('')
      setShareStatus(undefined)
    }, 1000)
    return () => clearInterval(tick)
  }, [day, now, store])

  const cardById = (id: string) => catalog.find((c) => c.id === id)
  const answerId = answerIdFor(schedule, day)
  const answer = answerId === undefined ? undefined : cardById(answerId)
  if (!answer) {
    return (
      <main>
        <h1>{text.title}</h1>
        <p>{text.noPuzzle}</p>
      </main>
    )
  }

  const won = guessedIds.includes(answer.id)
  // Backfills a win whose History write was lost; a Day already recorded is left as it was.
  if (won) recordSolved(store, day, guessedIds.indexOf(answer.id) + 1)
  const wrongIds = guessedIds.filter((id) => id !== answer.id)
  const options = suggestions(catalog, query, guessedIds)
  const origin = originFor(day)
  const yesterdayId = yesterdayAnswerIdFor(schedule, day)
  const yesterday = yesterdayId === undefined ? undefined : cardById(yesterdayId)

  const recordGuess = (id: string) => {
    const next = [...guessedIds, id]
    setGuessedIds(next)
    saveGuesses(store, day, next)
    if (id === answer.id) recordSolved(store, day, next.length)
    setQuery('')
  }
  const submitTyped = () => {
    const card = resolveTyped(options, query)
    if (card && !won) recordGuess(card.id)
  }

  const share = async () => {
    setShareStatus(undefined)
    try {
      await navigator.clipboard.writeText(shareText(day, guessedIds.indexOf(answer.id) + 1, text.shareTitle))
      setShareStatus('copied')
    } catch {
      setShareStatus('failed')
    }
  }

  return (
    <main>
      <h1>{text.title}</h1>
      <div class="card">
        <div class="frame">
          <img
            alt={text.artAlt}
            src={`${artBase}${answer.art}`}
            style={{
              transformOrigin: `${origin.x * 100}% ${origin.y * 100}%`,
              transform: `scale(${won ? 1 : scaleFor(wrongIds.length)})`,
            }}
          />
        </div>
        <div class="banner" data-testid="banner">
          {won ? answer.name : text.guessBanner(guessedIds.length + 1)}
        </div>
        <form
          class="guess"
          onSubmit={(e) => {
            e.preventDefault()
            submitTyped()
          }}
        >
          <input
            role="combobox"
            aria-label={text.inputLabel}
            aria-expanded={options.length > 0}
            aria-controls="suggestions"
            placeholder={text.inputPlaceholder}
            autocomplete="off"
            disabled={won}
            value={query}
            onInput={(e) => setQuery(e.currentTarget.value)}
          />
          <button type="submit" disabled={won}>
            {text.guessButton}
          </button>
          {options.length > 0 && (
            <ul id="suggestions" role="listbox" aria-label={text.suggestionsLabel}>
              {options.map((c) => (
                <li role="option" aria-selected={false} key={c.id} onClick={() => recordGuess(c.id)}>
                  {c.name}
                </li>
              ))}
            </ul>
          )}
        </form>
        <ul class="wrong-guesses" aria-label={text.wrongGuessesLabel}>
          {[...wrongIds].reverse().map((id) => (
            <li class="wrong" key={id}>
              {cardById(id)?.name}
            </li>
          ))}
        </ul>
      </div>
      {won && (
        <div class="share">
          <button type="button" onClick={share}>
            {text.shareButton}
          </button>
          <p role="status">
            {shareStatus === 'copied' ? text.shareCopied : shareStatus === 'failed' ? text.shareFailed : ''}
          </p>
        </div>
      )}
      <p class="daily-footer" data-testid="daily-footer">
        {yesterday && `${text.yesterdaysAnswer(yesterday.name)} · `}
        {text.nextPuzzle(countdown)}
      </p>
      <footer>{text.creditNote}</footer>
    </main>
  )
}
