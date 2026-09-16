import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { cache } from 'react'
import { DAYS, WEEKS } from './lattice'
import type { Snapshot } from './types'

const CELLS = WEEKS * DAYS

function valid(s: unknown): s is Snapshot {
  const c = s as Snapshot
  return (
    !!c &&
    Array.isArray(c.days) &&
    c.days.length === CELLS &&
    Array.isArray(c.channels) &&
    c.channels.length >= 2 &&
    Array.isArray(c.events)
  )
}

/**
 * The only source the pages read.
 *
 * Nothing here touches the network. The committed snapshot is the contract:
 * if it is present and well-shaped the site renders exactly as designed, and
 * if it is not, the fallback still produces a complete 53x7 grid so no pane
 * ever has to render a hole.
 */
export const loadSnapshot = cache(async (): Promise<Snapshot> => {
  for (const file of ['activity.json', 'activity.fallback.json']) {
    try {
      const raw = await readFile(path.join(process.cwd(), 'data', file), 'utf8')
      const parsed = JSON.parse(raw)
      if (valid(parsed)) return parsed
      console.warn(`[snapshot] data/${file} is malformed — falling through`)
    } catch {
      /* try the next one */
    }
  }
  throw new Error('no usable snapshot: data/activity.fallback.json is missing or malformed')
})
