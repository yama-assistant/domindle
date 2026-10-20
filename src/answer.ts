import { shiftDay, type Catalog, type CatalogEntry, type Day } from './game'

/** Public and fixed forever: with the hash, it defines every Answer. */
const SALT = 'domindle'

/** 32-bit FNV-1a with a murmur3 finalizer, since FNV alone mixes the last characters (where IDs differ) poorly. Fixed forever: changing it changes every Answer. */
function hashText(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
  return (h ^ (h >>> 16)) >>> 0
}

/** The Card with the highest hash for a Day; equal hashes go to the lower ID so Catalog order never matters. */
function winner(candidates: Catalog, day: Day): CatalogEntry | undefined {
  let best: { card: CatalogEntry; hash: number } | undefined
  for (const card of candidates) {
    const hash = hashText(`${SALT}:${day}:${card.id}`)
    if (!best || hash > best.hash || (hash === best.hash && card.id < best.card.id)) best = { card, hash }
  }
  return best?.card
}

/**
 * The Day's Answer: among the Cards that can be Answers, the one with the highest hash wins,
 * excluding the previous Day's winner (unless that leaves no Card). Undefined only when no Card can be an Answer.
 * The previous Day's winner is computed without its own exclusion, so nothing needs storing; the price is that a
 * Day can rarely (about once per N² Days) repeat the previous Day's published Answer.
 */
export function answerFor(catalog: Catalog, day: Day): CatalogEntry | undefined {
  const pool = catalog.filter((c) => c.answer)
  const yesterday = winner(pool, shiftDay(day, -1))
  return winner(pool.filter((c) => c.id !== yesterday?.id), day) ?? yesterday
}
