import { render } from 'preact'
import { App } from './App'
import catalog from './data/catalog.json'

function localStorageOrUndefined() {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

render(
  <App catalog={catalog} storage={localStorageOrUndefined()} now={() => new Date()} artBase={`${import.meta.env.BASE_URL}art/`} />,
  document.getElementById('app')!,
)
