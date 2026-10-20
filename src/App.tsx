import { useEffect, useMemo, useState } from 'preact/hooks'
import {
  type AnswerSchedule,
  type Catalog,
  answerIdFor,
  dayOf,
  originFor,
  resolveTyped,
  scaleFor,
  suggestions,
} from './game'
import { type KeyValueStorage, loadGuesses, safeStorage, saveGuesses } from './storage'
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

  useEffect(() => {
    const tick = setInterval(() => {
      const today = dayOf(now())
      if (today === day) return
      setDay(today)
      setGuessedIds(loadGuesses(store, today))
      setQuery('')
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
  const wrongIds = guessedIds.filter((id) => id !== answer.id)
  const options = suggestions(catalog, query, guessedIds)
  const origin = originFor(day)

  const recordGuess = (id: string) => {
    const next = [...guessedIds, id]
    setGuessedIds(next)
    saveGuesses(store, day, next)
    setQuery('')
  }
  const submitTyped = () => {
    const card = resolveTyped(options, query)
    if (card && !won) recordGuess(card.id)
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
      <footer>{text.creditNote}</footer>
    </main>
  )
}
