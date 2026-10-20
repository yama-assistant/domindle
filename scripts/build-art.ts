/**
 * Downloads every Answer's artwork once, resizes it to WebP and saves it under public/art/<id>.webp.
 * Run with `npm run build:art`; rerunnable, as files already present are skipped. Rules are in art/plan.ts.
 */
import { existsSync, mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import catalog from '../src/data/catalog.json' with { type: 'json' }
import { ART_WIDTH, fallbackUrl, report, wikiFiles, wikiUrl, type ArtOutcome } from './art/plan.ts'

const OUT = new URL('../public/art/', import.meta.url)
const THROTTLE_MS = 750

mkdirSync(OUT, { recursive: true })

let last = 0
async function download(url: string): Promise<Buffer | undefined> {
  const wait = last + THROTTLE_MS - Date.now()
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
  last = Date.now()
  const response = await fetch(url, { headers: { 'user-agent': 'domindle-art-pipeline (one-off local run)' } })
  return response.ok ? Buffer.from(await response.arrayBuffer()) : undefined
}

async function fetchArt(expansion: string, name: string) {
  for (const file of wikiFiles(name)) {
    const bytes = await download(wikiUrl(file))
    if (bytes) return { bytes, status: 'wiki' as const }
  }
  const url = fallbackUrl(expansion, name)
  const bytes = url && (await download(url))
  return bytes ? { bytes, status: 'fallback' as const } : undefined
}

const outcomes: ArtOutcome[] = []
for (const { id, name, expansion, answer } of catalog) {
  if (!answer) continue
  const file = new URL(`${id}.webp`, OUT)
  if (existsSync(file)) {
    outcomes.push({ id, name, status: 'present' })
    continue
  }
  const art = await fetchArt(expansion, name)
  if (!art) {
    outcomes.push({ id, name, status: 'missing' })
    console.log(`missing ${name}`)
    continue
  }
  const { width = 0 } = await sharp(art.bytes).metadata()
  await writeFile(file, await sharp(art.bytes).resize({ width: ART_WIDTH, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer())
  outcomes.push({ id, name, status: art.status, width })
  console.log(`${art.status} ${name}`)
}

console.log('\n' + report(outcomes))
