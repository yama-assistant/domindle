import { render } from 'preact'
import { App } from './App'
import catalog from './data/catalog.json'
import schedule from './data/schedule.json'

function localStorageOrUndefined() {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

render(
  <App catalog={catalog} schedule={schedule} storage={localStorageOrUndefined()} now={() => new Date()} artBase={`${import.meta.env.BASE_URL}art/`} />,
  document.getElementById('app')!,
)
