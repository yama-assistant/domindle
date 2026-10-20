import { createHash } from 'node:crypto'
import type { CatalogEntry as SiteEntry } from '../../src/game.ts'

export type Category = 'Card' | 'Landscape' | 'Extra' | 'Pile Placeholder'
export type LandscapeKind = 'Event' | 'Landmark' | 'Project' | 'Way' | 'Ally' | 'Trait' | 'Prophecy'
export type ExtraKind = 'Boon' | 'Hex' | 'State' | 'Artifact'

/** What the site reads. `answer` is true only for Cards that aren't Removed Cards. */
export type CatalogEntry = SiteEntry & {
  expansion: string
  edition: 1 | 2
  category: Category
  kind?: LandscapeKind | ExtraKind
  /** A 1st-edition Card superseded by the 2nd edition of its Expansion. */
  removed?: true
}

/** A card in sumpfork/dominiontabs `card_db_src/cards_db.json`. */
export type TabsCard = { card_tag: string; cardset_tags: string[]; group_tag?: string; group_top?: boolean }
/** blakevanlan/KingdomCreator `sets/*.yaml`, parsed. */
export type KcSet = Record<string, { name: string; type?: string }[] | string>

export type Upstream = {
  tabsCards: TabsCard[]
  /** `card_db_src/en_us/cards_en_us.json`, by card_tag. */
  tabsEnglish: Record<string, { name: string }>
  /** Parsed KingdomCreator set files, by file name without `.yaml`. */
  kingdomCreator: Record<string, KcSet>
}

/**
 * The KingdomCreator files used, in Catalog order, and the Expansion and Edition each one prints.
 * `guildscornucopia` is left out: it is just `cornucopia` and `guilds` together. The `-add` files
 * are the new Cards of a 2nd edition, already in the full 2nd-edition file, so they merge away.
 */
export const KC_SOURCES: Record<string, { expansion: string; edition: 1 | 2 }> = {
  'base-set': { expansion: 'Base', edition: 1 },
  'base-set-2': { expansion: 'Base', edition: 2 },
  'base-set-2-add': { expansion: 'Base', edition: 2 },
  intrigue: { expansion: 'Intrigue', edition: 1 },
  'intrigue-2': { expansion: 'Intrigue', edition: 2 },
  'intrigue-2-add': { expansion: 'Intrigue', edition: 2 },
  seaside: { expansion: 'Seaside', edition: 1 },
  'seaside-2': { expansion: 'Seaside', edition: 2 },
  'seaside-2-add': { expansion: 'Seaside', edition: 2 },
  alchemy: { expansion: 'Alchemy', edition: 1 },
  prosperity: { expansion: 'Prosperity', edition: 1 },
  'prosperity-2': { expansion: 'Prosperity', edition: 2 },
  'prosperity-2-add': { expansion: 'Prosperity', edition: 2 },
  cornucopia: { expansion: 'Cornucopia & Guilds', edition: 1 },
  guilds: { expansion: 'Cornucopia & Guilds', edition: 1 },
  'guildscornucopia-2': { expansion: 'Cornucopia & Guilds', edition: 2 },
  'guildscornucopia-2-add': { expansion: 'Cornucopia & Guilds', edition: 2 },
  hinterlands: { expansion: 'Hinterlands', edition: 1 },
  'hinterlands-2': { expansion: 'Hinterlands', edition: 2 },
  'hinterlands-2-add': { expansion: 'Hinterlands', edition: 2 },
  'dark-ages': { expansion: 'Dark Ages', edition: 1 },
  adventures: { expansion: 'Adventures', edition: 1 },
  empires: { expansion: 'Empires', edition: 1 },
  nocturne: { expansion: 'Nocturne', edition: 1 },
  renaissance: { expansion: 'Renaissance', edition: 1 },
  menagerie: { expansion: 'Menagerie', edition: 1 },
  allies: { expansion: 'Allies', edition: 1 },
  plunder: { expansion: 'Plunder', edition: 1 },
  risingsun: { expansion: 'Rising Sun', edition: 1 },
  promos: { expansion: 'Promos', edition: 1 },
}

/** The Expansion a dominiontabs card_tag set belongs to (for piles only dominiontabs names). */
const TABS_EXPANSIONS: Record<string, string> = {
  adventures: 'Adventures',
  allies: 'Allies',
  darkAges: 'Dark Ages',
  empires: 'Empires',
  menagerie: 'Menagerie',
  nocturne: 'Nocturne',
  plunder: 'Plunder',
  promo: 'Promos',
  renaissance: 'Renaissance',
  risingSun: 'Rising Sun',
}

/** KingdomCreator sections that hold one kind of thing each. */
const SECTIONS: Record<string, { category: Category; kind?: LandscapeKind | ExtraKind }> = {
  cards: { category: 'Card' },
  events: { category: 'Landscape', kind: 'Event' },
  landmarks: { category: 'Landscape', kind: 'Landmark' },
  projects: { category: 'Landscape', kind: 'Project' },
  ways: { category: 'Landscape', kind: 'Way' },
  allies: { category: 'Landscape', kind: 'Ally' },
  traits: { category: 'Landscape', kind: 'Trait' },
  prophecies: { category: 'Landscape', kind: 'Prophecy' },
  boons: { category: 'Extra', kind: 'Boon' },
}

/** `othercards` types that are Extras. Everything else there is a Card, bar mats and tokens. */
const OTHER_EXTRAS: Record<string, ExtraKind> = { Hexes: 'Hex', States: 'State', Artifacts: 'Artifact' }
const NOT_CARDS = /^(Mat |Tokens$|advToken$)/

/** Basic cards are printed in several sets (with alternate artwork); they belong to one Expansion. */
const BASIC_EXPANSIONS: Record<string, string> = { Potion: 'Alchemy', Platinum: 'Prosperity', Colony: 'Prosperity' }

/** IDs the seed Catalog (and so the art files) already use. */
const LEGACY_IDS: Record<string, string> = {
  'Base/Cellar': '7cdeea61e29d',
  'Base/Chapel': '7c3a6d881375',
  'Base/Festival': '2c9807c6f859',
  'Base/Market': 'c885196cbe84',
  'Base/Militia': '717a64b3f786',
  'Base/Mine': 'f53d3f5f8051',
  'Base/Moat': 'd7bda90f2921',
  'Base/Village': '71c68f4cdeb6',
}

const HIDE_SPLIT = / - to hide split card$/

const tidy = (name: string) => name.trim().replace(/\s+/g, ' ')
/** Compares names across sources: "Catapult - Rocks" and "Catapult / Rocks" are the same pile. */
const sameName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '')

type Item = { name: string; type?: string }
type Candidate = Omit<CatalogEntry, 'id' | 'art' | 'answer'>
type Classified = Pick<Candidate, 'category' | 'kind' | 'name'> & { expansion?: string }

/**
 * KingdomCreator also lists a pile as an ordinary `cards` row: either next to a "to hide split
 * card" row of the same name (Augurs, Castles, …) or, for Knights, with none.
 */
const isTopLevelPile = (name: string, hidden: Set<string>) => hidden.has(name) || name === 'Knights'

function classify(
  section: string,
  item: Item,
  hidden: Set<string>,
): Classified | undefined {
  const name = tidy(item.name)
  if (HIDE_SPLIT.test(name)) return { category: 'Pile Placeholder', name: name.replace(HIDE_SPLIT, '') }
  if (section === 'othercards') {
    const type = item.type ?? ''
    if (NOT_CARDS.test(type)) return undefined
    if (type in OTHER_EXTRAS) return { category: 'Extra', kind: OTHER_EXTRAS[type], name }
    if (type === 'Basic Cards') {
      // "Copper_2nd", "Copper2" and "Copper2_2nd" are alternate artwork of Copper.
      const basic = name.replace(/_2nd$/, '').replace(/2$/, '')
      return { category: 'Card', name: basic, expansion: BASIC_EXPANSIONS[basic] ?? 'Base' }
    }
    return { category: 'Card', name }
  }
  if (section === 'cards' && isTopLevelPile(name, hidden)) return { category: 'Pile Placeholder', name }
  const { category, kind } = SECTIONS[section] ?? {}
  return category && { category, kind, name }
}

export function buildCatalog(upstream: Upstream): CatalogEntry[] {
  const latest = new Map<string, number>()
  for (const { expansion, edition } of Object.values(KC_SOURCES))
    latest.set(expansion, Math.max(latest.get(expansion) ?? 1, edition))

  // One candidate per Expansion and name; the highest Edition seen wins.
  const candidates = new Map<string, Candidate>()
  const add = (candidate: Candidate) => {
    const key = `${candidate.expansion}/${sameName(candidate.name)}`
    const existing = candidates.get(key)
    if (!existing) candidates.set(key, candidate)
    // Otherwise keep the first-seen name, the higher Edition, and any Pile Placeholder category.
    // A pile name is never also a Card, whichever source says so first.
    else if (candidate.category === 'Pile Placeholder' || candidate.edition > existing.edition)
      candidates.set(key, {
        ...candidate,
        category: existing.category === 'Pile Placeholder' ? 'Pile Placeholder' : candidate.category,
        edition: Math.max(candidate.edition, existing.edition) as 1 | 2,
        name: existing.name,
      })
  }

  for (const [file, { expansion, edition }] of Object.entries(KC_SOURCES)) {
    const set = upstream.kingdomCreator[file]
    if (!set) continue
    const hidden = new Set(
      (Array.isArray(set.othercards) ? set.othercards : [])
        .map((item) => tidy(item.name))
        .filter((name) => HIDE_SPLIT.test(name))
        .map((name) => name.replace(HIDE_SPLIT, '')),
    )
    for (const [section, items] of Object.entries(set)) {
      if (!Array.isArray(items)) continue
      for (const item of items) {
        const classified = classify(section, item, hidden)
        if (!classified) continue
        add({ ...classified, expansion: classified.expansion ?? expansion, edition })
      }
    }
  }

  // dominiontabs marks a pile with `group_top` and a group named after the pile itself. A lead
  // Card (Page, Hermit, …) heads a group named for the whole chain, so isn't a pile.
  const piles = upstream.tabsCards
    .filter((c) => c.group_top && c.group_tag === c.card_tag)
    .sort((a, b) => a.card_tag.localeCompare(b.card_tag))
  for (const pile of piles) {
    const expansion = pile.cardset_tags.map((t) => TABS_EXPANSIONS[t]).find(Boolean)
    if (!expansion) continue
    const name = tidy(upstream.tabsEnglish[pile.card_tag]?.name ?? pile.card_tag)
    add({ name, expansion, edition: 1, category: 'Pile Placeholder' })
  }

  const ids = new Set<string>()
  return [...candidates.values()].map((c) => {
    const removed = c.category === 'Card' && c.edition < (latest.get(c.expansion) ?? 1)
    const key = `${c.expansion}/${c.name}`
    const id = LEGACY_IDS[key] ?? createHash('sha256').update(key).digest('hex').slice(0, 12)
    if (ids.has(id)) throw new Error(`Duplicate Catalog ID ${id} for ${key}`)
    ids.add(id)
    return {
      id,
      name: c.name,
      answer: c.category === 'Card' && !removed,
      art: `${id}.webp`,
      expansion: c.expansion,
      edition: c.edition,
      category: c.category,
      ...(c.kind && { kind: c.kind }),
      ...(removed && { removed: true as const }),
    }
  })
}
