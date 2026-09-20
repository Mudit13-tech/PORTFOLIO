import { DAYS, WEEKS } from '@/lib/lattice'

/**
 * Conway B3/S23 on a 53x7 torus.
 *
 * The board wraps on both axes. A bounded 7-row board starves within a few
 * generations — wrapping is what lets a year of real activity actually behave
 * like a population rather than a flicker.
 */
export function step(src: Uint8Array, dst: Uint8Array): number {
  let alive = 0
  for (let y = 0; y < DAYS; y++) {
    const up = ((y - 1 + DAYS) % DAYS) * WEEKS
    const mid = y * WEEKS
    const dn = ((y + 1) % DAYS) * WEEKS
    for (let x = 0; x < WEEKS; x++) {
      const l = (x - 1 + WEEKS) % WEEKS
      const r = (x + 1) % WEEKS
      const n =
        src[up + l] + src[up + x] + src[up + r] +
        src[mid + l] + src[mid + r] +
        src[dn + l] + src[dn + x] + src[dn + r]
      const v = src[mid + x] ? (n === 2 || n === 3 ? 1 : 0) : n === 3 ? 1 : 0
      dst[mid + x] = v
      alive += v
    }
  }
  return alive
}

/** Board index (row-major, weeks across) for a day index (column-major). */
export function boardIndex(dayIndex: number): number {
  const week = Math.floor(dayIndex / DAYS)
  const dow = dayIndex % DAYS
  return dow * WEEKS + week
}

/** Inverse of boardIndex. */
export function dayIndex(board: number): number {
  const dow = Math.floor(board / WEEKS)
  const week = board % WEEKS
  return week * DAYS + dow
}

export type SeedMode = 'active' | 'parity'

/**
 * How generation zero is drawn from the year.
 *
 * 'active' is the literal reading — any day with any activity is a live cell.
 * Measured against the committed snapshot it seeds 92 cells and settles into
 * six still lifes by generation three: a run of consecutive active days is a
 * solid block, and the interior of a solid block dies of overpopulation on the
 * first tick. That is Conway behaving correctly, not a bug, but it does mean
 * the simulation is over in half a second.
 *
 * 'parity' seeds a day whose combined count is odd. Same data, similar density
 * (50 cells), but the solid rectangles come out textured rather than solid, so
 * they break into gliders and oscillators instead of collapsing. Measured on
 * the same snapshot it was still running at generation 200 with ~168 alive.
 *
 * The default is the literal one. Change this single constant to 'parity' for
 * a simulation that runs indefinitely.
 */
export const SEED_MODE: SeedMode = 'active'

/**
 * Builds generation zero. `counts[i]` is a day's combined event count, or null
 * for a day the window covers but the calendar has not reached yet.
 */
export function seedFrom(counts: Array<number | null>, mode: SeedMode = SEED_MODE): Uint8Array {
  const b = new Uint8Array(WEEKS * DAYS)
  for (let i = 0; i < counts.length; i++) {
    const n = counts[i]
    if (n === null) continue
    const live = mode === 'parity' ? n % 2 === 1 : n > 0
    if (live) b[boardIndex(i)] = 1
  }
  return b
}

export const same = (a: Uint8Array, b: Uint8Array): boolean => {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}
