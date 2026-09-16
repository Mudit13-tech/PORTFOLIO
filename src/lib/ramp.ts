import type { Day } from './types'

export type Level = 0 | 1 | 2 | 3 | 4
export type Thresholds = readonly [number, number, number, number]

/**
 * Intensity thresholds derived from the year's own distribution, so a quiet
 * year still uses the whole ramp and a loud one does not saturate at level 4
 * by February. Level 1 always means "at least one".
 */
export function thresholds(values: number[]): Thresholds {
  const v = values.filter((n) => n > 0).sort((a, b) => a - b)
  if (v.length === 0) return [1, 2, 3, 4]
  const q = (p: number) => v[Math.min(v.length - 1, Math.floor(v.length * p))]
  const t1 = 1
  const t2 = Math.max(t1 + 1, q(0.5))
  const t3 = Math.max(t2 + 1, q(0.78))
  const t4 = Math.max(t3 + 1, q(0.94))
  return [t1, t2, t3, t4]
}

export function level(n: number, t: Thresholds): Level {
  if (n <= 0) return 0
  if (n < t[1]) return 1
  if (n < t[2]) return 2
  if (n < t[3]) return 3
  return 4
}

export function scales(days: Day[]) {
  return {
    gh: thresholds(days.map((d) => d.commits)),
    lc: thresholds(days.map((d) => d.solved)),
  }
}
