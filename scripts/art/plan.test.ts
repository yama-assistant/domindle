import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { fallbackUrl, report, wikiFiles, wikiUrl, type ArtOutcome } from './plan.ts'

describe('wikiUrl', () => {
  it('follows the MediaWiki md5 scheme', () => {
    const md5 = createHash('md5').update('CellarArt.jpg').digest('hex')
    expect(wikiUrl('CellarArt.jpg')).toBe(
      `https://wiki.dominionstrategy.com/images/${md5[0]}/${md5.slice(0, 2)}/CellarArt.jpg`,
    )
  })

  it('hashes and names the file with underscores for spaces', () => {
    const md5 = createHash('md5').update('Hunting_PartyArt.jpg').digest('hex')
    expect(wikiUrl('Hunting PartyArt.jpg')).toBe(
      `https://wiki.dominionstrategy.com/images/${md5[0]}/${md5.slice(0, 2)}/Hunting_PartyArt.jpg`,
    )
  })
})

describe('wikiFiles', () => {
  it('tries the name as is, then without spaces', () => {
    expect(wikiFiles('Cellar')).toEqual(['CellarArt.jpg'])
    expect(wikiFiles('Hunting Party')).toEqual(['Hunting PartyArt.jpg', 'HuntingPartyArt.jpg'])
  })
})

describe('fallbackUrl', () => {
  it('points at KingdomCreator by Expansion and Card', () => {
    expect(fallbackUrl('Base', 'Cellar')).toBe('https://kingdomcreator.com/img/cards/baseset2/baseset2_cellar.jpg')
    expect(fallbackUrl('Rising Sun', "Artist's Studio")).toMatch(/risingsun_artistsstudio\.jpg$/)
  })

  it('has none for an unknown Expansion', () => {
    expect(fallbackUrl('Nowhere', 'Cellar')).toBeUndefined()
  })
})

describe('report', () => {
  const outcomes: ArtOutcome[] = [
    { id: 'a', name: 'Cellar', status: 'present' },
    { id: 'b', name: 'Chapel', status: 'wiki', width: 1400 },
    { id: 'c', name: 'Moat', status: 'wiki', width: 640 },
    { id: 'd', name: 'Mine', status: 'fallback', width: 1000 },
    { id: 'e', name: 'Witch', status: 'missing' },
  ]

  it('lists missing, low-resolution and fallback art', () => {
    const text = report(outcomes)
    expect(text).toContain('Missing (1):\n  Witch (e)')
    expect(text).toContain('Moat (c): 640px')
    expect(text).not.toContain('Chapel (b)')
    expect(text).toContain('From the KingdomCreator fallback (1):\n  Mine (d)')
    expect(text).toContain('5 Answers: 1 already present, 2 from the wiki, 1 from the fallback, 1 missing')
  })

  it('omits empty sections', () => {
    expect(report([{ id: 'a', name: 'Cellar', status: 'present' }])).toBe(
      '1 Answers: 1 already present, 0 from the wiki, 0 from the fallback, 0 missing',
    )
  })
})
