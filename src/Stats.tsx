import { useLayoutEffect, useRef } from 'preact/hooks'
import { HISTOGRAM_BUCKETS, type Stats } from './stats'
import { text } from './text'

export function StatsView({ stats }: { stats: Stats }) {
  const summary: [label: string, value: string | number][] = [
    [text.statPlayed, stats.played],
    [text.statStreak, stats.streak],
    [text.statBestStreak, stats.bestStreak],
    [text.statAverage, stats.averageScore === undefined ? text.noAverage : stats.averageScore.toFixed(1)],
  ]
  const tallest = Math.max(...stats.histogram, 1)
  return (
    <div class="stats">
      <dl>
        {summary.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <ol class="histogram" aria-label={text.histogramLabel}>
        {stats.histogram.map((count, i) => {
          const bucket = text.histogramBucket(i + 1, i + 1 === HISTOGRAM_BUCKETS)
          return (
            <li key={i} aria-label={text.histogramRow(bucket, count)}>
              <span class="label">{bucket}</span>
              <span class="bar" style={{ width: `${(count / tallest) * 100}%` }}>
                {count}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

type DialogProps = {
  stats: Stats
  onClose: () => void
  /** Focus returns here when the pop-up closes. */
  returnFocusTo: { current: HTMLElement | null }
}

/** The Stats pop-up: closes on Escape, the Close button or a click outside it. */
export function StatsDialog({ stats, onClose, returnFocusTo }: DialogProps) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  // Layout effect so Escape works the moment the pop-up appears.
  useLayoutEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current()
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      returnFocusTo.current?.focus()
    }
  }, [returnFocusTo])
  return (
    <div class="backdrop" data-testid="backdrop" onClick={onClose}>
      <div class="dialog" role="dialog" aria-modal="true" aria-label={text.statsTitle} onClick={(e) => e.stopPropagation()}>
        <h2>{text.statsTitle}</h2>
        <StatsView stats={stats} />
        <button type="button" autofocus onClick={onClose}>
          {text.closeButton}
        </button>
      </div>
    </div>
  )
}
