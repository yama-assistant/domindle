import { useEffect, useState } from 'preact/hooks'
import {
  type Catalog,
  type Schedule,
  answerIdFor,
  dayOf,
  normalize,
  originFor,
  scaleFor,
  suggestions,
} from './game'
import { text } from './text'
import './style.css'

type Props = { catalog: Catalog; schedule: Schedule; now: () => Date; artBase: string }

export function App({ catalog, schedule, now, artBase }: Props) {
  const [day, setDay] = useState(() => dayOf(now()))
  const [guessed, setGuessed] = useState<string[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    const tick = setInterval(() => {
      const today = dayOf(now())
      if (today === day) return
      setDay(today)
      setGuessed([])
      setQuery('')
    }, 1000)
    return () => clearInterval(tick)
  }, [day, now])

  const answer = catalog.find((c) => c.id === answerIdFor(schedule, day))!
  const won = guessed.includes(answer.id)
  const wrong = guessed.filter((id) => id !== answer.id)
  const byId = (id: string) => catalog.find((c) => c.id === id)!
  const options = suggestions(catalog.filter((c) => c.answer), query, guessed)
  const origin = originFor(day)

  const submit = (id: string) => {
    setGuessed([...guessed, id])
    setQuery('')
  }
  const submitTyped = () => {
    const exact = options.find((c) => normalize(c.name) === normalize(query))
    const pick = exact ?? options[0]
    if (pick) submit(pick.id)
  }

  return (
    <main>
      <h1>{text.title}</h1>
      <div class="frame">
        <img
          alt={text.artAlt}
          src={`${artBase}${answer.art}`}
          style={{
            transformOrigin: `${origin.x * 100}% ${origin.y * 100}%`,
            transform: `scale(${won ? 1 : scaleFor(wrong.length)})`,
          }}
        />
        <div class="banner" data-testid="banner">
          {won ? answer.name : text.guessBanner(guessed.length + 1)}
        </div>
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
              <li role="option" aria-selected={false} key={c.id} onClick={() => submit(c.id)}>
                {c.name}
              </li>
            ))}
          </ul>
        )}
      </form>
      <ul class="wrong-guesses" aria-label={text.wrongGuessesLabel}>
        {[...wrong].reverse().map((id) => (
          <li class="wrong" key={id}>
            {byId(id).name}
          </li>
        ))}
      </ul>
      <footer>{text.creditNote}</footer>
    </main>
  )
}
