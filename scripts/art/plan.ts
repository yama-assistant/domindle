import { createHash } from 'node:crypto'

export const WIKI = 'https://wiki.dominionstrategy.com/images'
export const KC_IMAGES = 'https://kingdomcreator.com/img/cards'
/** Art is resized down to this width, never up. */
export const ART_WIDTH = 1000

/** The MediaWiki md5 scheme: `/images/{md5[0]}/{md5[0:2]}/{File}`, spaces in the file name as underscores. */
export function wikiUrl(file: string): string {
  const name = file.replace(/ /g, '_')
  const md5 = createHash('md5').update(name).digest('hex')
  return `${WIKI}/${md5[0]}/${md5.slice(0, 2)}/${encodeURIComponent(name)}`
}

/** Wiki art file names to try for a Card, most likely first. Files are usually `<Name>Art.jpg`. */
export function wikiFiles(name: string): string[] {
  const files = [`${name}Art.jpg`, `${name.replace(/ /g, '')}Art.jpg`]
  return [...new Set(files)]
}

/** KingdomCreator's directory for each Expansion's cards (it names them by set, not by Edition). */
const KC_DIRS: Record<string, string> = {
  Base: 'baseset2',
  Intrigue: 'intrigue2',
  Seaside: 'seaside2',
  Alchemy: 'alchemy',
  Prosperity: 'prosperity2',
  'Cornucopia & Guilds': 'cornucopiaguilds2',
  Hinterlands: 'hinterlands2',
  'Dark Ages': 'darkages',
  Adventures: 'adventures',
  Empires: 'empires',
  Nocturne: 'nocturne',
  Renaissance: 'renaissance',
  Menagerie: 'menagerie',
  Allies: 'allies',
  Plunder: 'plunder',
  'Rising Sun': 'risingsun',
  Promos: 'promos',
}

/** Fallback for when the wiki has no art: KingdomCreator's card image. Undefined for an unknown Expansion. */
export function fallbackUrl(expansion: string, name: string): string | undefined {
  const dir = KC_DIRS[expansion]
  return dir && `${KC_IMAGES}/${dir}/${dir}_${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.jpg`
}

export type ArtOutcome =
  | { id: string; name: string; status: 'present' }
  | { id: string; name: string; status: 'wiki' | 'fallback'; width: number }
  | { id: string; name: string; status: 'missing' }

/** The end-of-run report: missing art, art under `ART_WIDTH` wide, and art that came from the fallback. */
export function report(outcomes: ArtOutcome[]): string {
  const lines: string[] = []
  const section = (title: string, items: string[]) => {
    if (items.length) lines.push(`${title} (${items.length}):`, ...items.map((i) => `  ${i}`))
  }
  section('Missing', outcomes.filter((o) => o.status === 'missing').map((o) => `${o.name} (${o.id})`))
  section(
    `Low resolution (under ${ART_WIDTH}px wide)`,
    outcomes.flatMap((o) => ((o.status === 'wiki' || o.status === 'fallback') && o.width < ART_WIDTH ? [`${o.name} (${o.id}): ${o.width}px`] : [])),
  )
  section('From the KingdomCreator fallback', outcomes.filter((o) => o.status === 'fallback').map((o) => `${o.name} (${o.id})`))
  const count = (status: ArtOutcome['status']) => outcomes.filter((o) => o.status === status).length
  lines.push(
    `${outcomes.length} Answers: ${count('present')} already present, ${count('wiki')} from the wiki, ` +
      `${count('fallback')} from the fallback, ${count('missing')} missing`,
  )
  return lines.join('\n')
}
