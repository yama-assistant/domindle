/**
 * Rebuilds src/data/catalog.json from the upstream datasets. Run with `npm run build:catalog`.
 * Fetching and parsing live here; the rules are in catalog/build.ts.
 */
import { writeFileSync } from 'node:fs'
import { parse } from 'yaml'
import { buildCatalog, KC_SOURCES, type Upstream } from './catalog/build.ts'

const TABS = 'https://raw.githubusercontent.com/sumpfork/dominiontabs/master/card_db_src'
const KC = 'https://raw.githubusercontent.com/blakevanlan/KingdomCreator/master/sets'

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url}: ${response.status} ${response.statusText}`)
  return response.text()
}

const upstream: Upstream = {
  tabsCards: JSON.parse(await fetchText(`${TABS}/cards_db.json`)),
  tabsEnglish: JSON.parse(await fetchText(`${TABS}/en_us/cards_en_us.json`)),
  kingdomCreator: Object.fromEntries(
    await Promise.all(
      Object.keys(KC_SOURCES).map(async (file) => [file, parse(await fetchText(`${KC}/${file}.yaml`))] as const),
    ),
  ),
}

const catalog = buildCatalog(upstream)
writeFileSync(new URL('../src/data/catalog.json', import.meta.url), JSON.stringify(catalog, null, 2) + '\n')

const count = (pick: (e: (typeof catalog)[number]) => boolean) => catalog.filter(pick).length
console.log(
  `${catalog.length} entries: ${count((e) => e.answer)} Answers, ${count((e) => !!e.removed)} Removed Cards, ` +
    `${count((e) => e.category === 'Landscape')} Landscapes, ${count((e) => e.category === 'Extra')} Extras, ` +
    `${count((e) => e.category === 'Pile Placeholder')} Pile Placeholders`,
)
