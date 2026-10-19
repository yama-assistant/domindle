import { render } from 'preact'
import { App } from './App'
import catalog from './data/catalog.json'
import schedule from './data/schedule.json'

render(
  <App catalog={catalog} schedule={schedule} now={() => new Date()} artBase={`${import.meta.env.BASE_URL}art/`} />,
  document.getElementById('app')!,
)
