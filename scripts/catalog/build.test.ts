// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { parse } from 'yaml'
import { buildCatalog, type Upstream, type CatalogEntry } from './build.ts'

const fixtures = new URL('./fixtures/', import.meta.url)
const readJson = (name: string) => JSON.parse(readFileSync(new URL(name, fixtures), 'utf8'))

const upstream: Upstream = {
  tabsCards: readJson('tabs-cards.json'),
  tabsEnglish: readJson('tabs-en.json'),
  kingdomCreator: Object.fromEntries(
    readdirSync(new URL('kingdomcreator/', fixtures)).map((f) => [
      f.replace(/\.yaml$/, ''),
      parse(readFileSync(new URL(`kingdomcreator/${f}`, fixtures), 'utf8')),
    ]),
  ),
}

const catalog = buildCatalog(upstream)
const named = (name: string) => catalog.filter((e) => e.name === name)
const only = (name: string): CatalogEntry => {
  const found = named(name)
  expect(found, `entries named ${name}`).toHaveLength(1)
  return found[0]
}

describe('categories', () => {
  it.each([
    ['Cellar', 'Card', undefined],
    ['Advance', 'Landscape', 'Event'],
    ['Aqueduct', 'Landscape', 'Landmark'],
    ['Cathedral', 'Landscape', 'Project'],
    ['Way of the Butterfly', 'Landscape', 'Way'],
    ["Architects' Guild", 'Landscape', 'Ally'],
    ['Cheap', 'Landscape', 'Trait'],
    ['Approaching Army', 'Landscape', 'Prophecy'],
    ["The Earth's Gift", 'Extra', 'Boon'],
    ['Haunting', 'Extra', 'Hex'],
    ['Deluded', 'Extra', 'State'],
    ['Lucky Coin', 'Card', undefined],
    ['Augurs', 'Pile Placeholder', undefined],
  ])('%s is a %s %s', (name, category, kind) => {
    const entry = only(name)
    expect(entry.category).toBe(category)
    expect(entry.kind).toBe(kind)
  })

  it('records the Expansion and Edition', () => {
    expect(only('Sorceress')).toMatchObject({ expansion: 'Allies', edition: 1 })
    expect(only('Harbinger')).toMatchObject({ expansion: 'Base', edition: 2 })
  })

  it('leaves out mats and tokens', () => {
    expect(named('Tavern_mat')).toEqual([])
  })

  it('gives every entry a unique opaque ID and art file', () => {
    const ids = catalog.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const e of catalog) {
      expect(e.id).toMatch(/^[0-9a-f]{12}$/)
      expect(e.art).toBe(`${e.id}.jpg`)
    }
  })

  it('only lets Cards be Answers', () => {
    for (const e of catalog) expect(e.answer).toBe(e.category === 'Card' && !e.removed)
  })
})

describe('Pile Placeholders', () => {
  it('catalogues the Augurs pile as a PP, never an Answer, and its members as Cards', () => {
    expect(only('Augurs')).toMatchObject({ category: 'Pile Placeholder', answer: false })
    for (const name of ['Herb Gatherer', 'Acolyte', 'Sorceress', 'Sibyl'])
      expect(only(name)).toMatchObject({ category: 'Card', answer: true })
  })

  it('recognises KingdomCreator "to hide split card" rows and top-level pile entries', () => {
    expect(only('Castles')).toMatchObject({ category: 'Pile Placeholder', answer: false })
    expect(only('Knights')).toMatchObject({ category: 'Pile Placeholder', answer: false })
    expect(only('Encampment / Plunder')).toMatchObject({ category: 'Pile Placeholder', answer: false })
    expect(only('Sauna / Avanto')).toMatchObject({ category: 'Pile Placeholder', answer: false })
  })

  it('catalogues each pile only once even when both sources name it', () => {
    expect(named('Encampment / Plunder')).toHaveLength(1)
    expect(named('Sauna / Avanto')).toHaveLength(1)
  })

  it('also recognises a pile only dominiontabs names (group_top, group named for the pile)', () => {
    expect(only('Catapult / Rocks')).toMatchObject({ category: 'Pile Placeholder', expansion: 'Empires', answer: false })
  })

  it('keeps Traveller and other lead Cards that merely head a dominiontabs group as Cards', () => {
    expect(only('Page')).toMatchObject({ category: 'Card', answer: true })
    expect(only('Hermit')).toMatchObject({ category: 'Card', answer: true })
    expect(only('Tournament')).toMatchObject({ category: 'Card' })
  })
})

describe('Knights and Castles', () => {
  it('makes each Knight and each Castle its own Card', () => {
    for (const name of ['Dame Anna', 'Sir Martin', 'Humble Castle', 'Crumbling Castle'])
      expect(only(name)).toMatchObject({ category: 'Card', answer: true })
  })
})

describe('Editions', () => {
  it('lets the 2nd-edition entry win where a Card exists in both', () => {
    expect(named('Cellar')).toHaveLength(1)
    expect(only('Cellar')).toMatchObject({ edition: 2, answer: true })
    expect(only('Cellar').removed).toBeUndefined()
  })

  it('tags 1st-edition Cards superseded by the 2nd as Removed Cards and not Answers', () => {
    expect(only('Woodcutter')).toMatchObject({ edition: 1, removed: true, answer: false })
    expect(only('Coppersmith')).toMatchObject({ edition: 1, removed: true, answer: false })
    expect(only('Great Hall')).toMatchObject({ removed: true, answer: false })
  })

  it('treats Cornucopia and Guilds as one Expansion across editions', () => {
    expect(only('Advisor')).toMatchObject({ expansion: 'Cornucopia & Guilds', edition: 2, answer: true })
    expect(only('Joust')).toMatchObject({ expansion: 'Cornucopia & Guilds', edition: 2 })
    expect(only('Tournament')).toMatchObject({ edition: 1, removed: true, answer: false })
    expect(only('Bag Of Gold')).toMatchObject({ removed: true, answer: false })
  })

  it('does not double-count the combined 1st-edition Guilds / Cornucopia set', () => {
    expect(named('Advisor')).toHaveLength(1)
  })

  it('does not tag Cards Removed in an Expansion with only one Edition', () => {
    expect(only('Familiar')).toMatchObject({ edition: 1, answer: true })
    expect(only('Familiar').removed).toBeUndefined()
  })
})

describe('Promos and other Cards', () => {
  it('makes Promos their own Expansion and includes them', () => {
    expect(only('Black Market')).toMatchObject({ expansion: 'Promos', category: 'Card', answer: true })
    expect(only('Summon')).toMatchObject({ expansion: 'Promos', category: 'Landscape', kind: 'Event' })
    expect(only('Sauna')).toMatchObject({ expansion: 'Promos', category: 'Card' })
  })

  it('includes Base cards once, whichever set prints them', () => {
    for (const name of ['Copper', 'Curse']) {
      expect(named(name)).toHaveLength(1)
      expect(only(name)).toMatchObject({ expansion: 'Base', edition: 2, answer: true })
    }
    expect(only('Potion')).toMatchObject({ expansion: 'Alchemy', answer: true })
    expect(only('Platinum')).toMatchObject({ expansion: 'Prosperity', edition: 2, answer: true })
  })

  it('includes non-Supply Cards, Heirlooms, Traveller upgrades and Ruins as Answers', () => {
    for (const name of ['Madman', 'Cursed Gold', 'Champion', 'Peasant', 'Abandoned Mine', 'Doubloons', 'Pasture'])
      expect(only(name)).toMatchObject({ category: 'Card', answer: true })
  })
})

describe('stable IDs', () => {
  it('rebuilds identical IDs from the same data', () => {
    expect(buildCatalog(upstream)).toEqual(catalog)
  })

  it('does not depend on the order of the upstream data', () => {
    const reversed: Upstream = {
      ...upstream,
      tabsCards: [...upstream.tabsCards].reverse(),
      kingdomCreator: Object.fromEntries(Object.entries(upstream.kingdomCreator).reverse()),
    }
    const byId = (c: CatalogEntry[]) => Object.fromEntries(c.map((e) => [e.name, e.id]))
    expect(byId(buildCatalog(reversed))).toEqual(byId(catalog))
  })

  it('keeps the IDs of the seed Catalog Cards', () => {
    expect(only('Cellar').id).toBe('7cdeea61e29d')
  })

  it("doesn't change an ID when a Card's Edition changes", () => {
    const firstEditionOnly: Upstream = {
      ...upstream,
      kingdomCreator: Object.fromEntries(Object.entries(upstream.kingdomCreator).filter(([k]) => k !== 'base-set-2')),
    }
    expect(buildCatalog(firstEditionOnly).find((e) => e.name === 'Chapel')!.id).toBe(only('Chapel').id)
  })
})
