import { shiftDay, type Catalog, type CatalogEntry, type Day } from './game'

/** Public and fixed forever: with the hash, it defines every Answer. */
const SALT = 'domindle'

/** 32-bit FNV-1a with a murmur3 finalizer, since FNV alone mixes the last characters (where IDs differ) poorly. Fixed forever: changing it changes every Answer. */
function fnv1a(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
  return (h ^ (h >>> 16)) >>> 0
}

/** The Card with the highest hash for a Day; equal hashes go to the lower ID so Catalog order never matters. */
function winner(candidates: Catalog, day: Day): CatalogEntry | undefined {
  let best: CatalogEntry | undefined
  let bestHash = -1
  for (const c of candidates) {
    const h = fnv1a(`${SALT}:${day}:${c.id}`)
    if (h > bestHash || (h === bestHash && best && c.id < best.id)) [best, bestHash] = [c, h]
  }
  return best
}

/**
 * The Day's Answer: among the Cards that can be Answers, the one with the highest hash wins,
 * excluding the previous Day's winner (unless that leaves no Card). Undefined only when no Card can be an Answer.
 */
export function answerFor(catalog: Catalog, day: Day): CatalogEntry | undefined {
  const pool = catalog.filter((c) => c.answer)
  const yesterday = winner(pool, shiftDay(day, -1))
  return winner(pool.filter((c) => c !== yesterday), day) ?? yesterday
}
