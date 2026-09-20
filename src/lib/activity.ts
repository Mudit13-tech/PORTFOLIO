import { activity, type ActivityDay } from '~/data'

/**
 * The heatmap's model. Pure data — no React, no DOM — so the grid the
 * component draws is the grid you can print and check.
 *
 * Two channels share one cell: GitHub contributions in the upper-left
 * triangle, LeetCode submissions in the lower-right. They are never summed.
 * Adding a commit count to a problem count produces a number that means
 * nothing, and a chart built on a meaningless number is decoration.
 */

export const DOW = 7
export const WEEKS = Math.ceil(activity.days.length / DOW)

/** 0 = nothing happened. 1-4 index the ramp. */
export type Level = 0 | 1 | 2 | 3 | 4

/**
 * Cut points for the ramp, taken from this year's own distribution rather than
 * from an invented ceiling. Quartiles over the days that had any activity, so
 * one twenty-commit day cannot flatten every ordinary one to the palest step.
 */
function quartiles(values: number[]): [number, number, number] {
  const active = values.filter((v) => v > 0).sort((a, b) => a - b)
  if (active.length === 0) return [1, 2, 3]
  const at = (q: number) => active[Math.min(active.length - 1, Math.floor(active.length * q))]
  // Distinct cut points, so a low-variance channel still produces four steps.
  const a = Math.max(1, at(0.25))
  const b = Math.max(a + 1, at(0.5))
  const c = Math.max(b + 1, at(0.75))
  return [a, b, c]
}

const CUTS = {
  commits: quartiles(activity.days.map((d) => d.commits)),
  solved: quartiles(activity.days.map((d) => d.solved)),
}

function level(n: number, cuts: [number, number, number]): Level {
  if (n <= 0) return 0
  if (n <= cuts[0]) return 1
  if (n <= cuts[1]) return 2
  if (n <= cuts[2]) return 3
  return 4
}

export interface Cell {
  day: ActivityDay
  /** Column, 0-based from the oldest week. */
  week: number
  /** Row, 0 = Sunday. */
  dow: number
  gh: Level
  lc: Level
}

export const cells: Cell[] = activity.days.map((day, i) => ({
  day,
  week: Math.floor(i / DOW),
  dow: i % DOW,
  gh: level(day.commits, CUTS.commits),
  lc: level(day.solved, CUTS.solved),
}))

/** Month ticks: the first column of each month, skipping the crowded last two. */
export const monthTicks = (() => {
  const out: Array<{ label: string; week: number }> = []
  let last = ''
  for (let w = 0; w < WEEKS; w++) {
    const c = cells[w * DOW]
    if (!c) continue
    const label = new Date(`${c.day.date}T00:00:00Z`).toLocaleString('en-US', {
      month: 'short',
      timeZone: 'UTC',
    })
    if (label !== last && w < WEEKS - 2) {
      out.push({ label, week: w })
      last = label
    }
  }
  return out
})()

function streaks(days: ActivityDay[]) {
  let longest = 0
  let current = 0
  let endedOn: string | null = null
  for (const d of days) {
    if (d.commits > 0 || d.solved > 0) {
      current += 1
      if (current > longest) {
        longest = current
        endedOn = d.date
      }
    } else {
      current = 0
    }
  }
  // Counted backwards from the end of the window, which is what "current" can
  // honestly mean for a snapshot that is not refetched on every render.
  let trailing = 0
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].commits > 0 || days[i].solved > 0) trailing += 1
    else break
  }
  return { longest, endedOn, trailing }
}

const busiest = activity.days.reduce((best, d) =>
  d.commits + d.solved > best.commits + best.solved ? d : best,
)

export const activityStats = {
  from: activity.from,
  to: activity.to,
  days: activity.days.length,
  commits: activity.days.reduce((n, d) => n + d.commits, 0),
  solved: activity.days.reduce((n, d) => n + d.solved, 0),
  activeDays: activity.days.filter((d) => d.commits > 0 || d.solved > 0).length,
  busiest,
  ...streaks(activity.days),
} as const

/** Monthly totals — the table alternative to the grid, for anyone reading it
 * with a screen reader or with colour turned off. */
export const byMonth = (() => {
  const map = new Map<string, { label: string; commits: number; solved: number; days: number }>()
  for (const d of activity.days) {
    const key = d.date.slice(0, 7)
    const entry = map.get(key) ?? {
      label: new Date(`${d.date}T00:00:00Z`).toLocaleString('en-US', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }),
      commits: 0,
      solved: 0,
      days: 0,
    }
    entry.commits += d.commits
    entry.solved += d.solved
    if (d.commits > 0 || d.solved > 0) entry.days += 1
    map.set(key, entry)
  }
  return [...map.entries()].map(([key, v]) => ({ key, ...v }))
})()

/** "14 March 2026" — one formatter, so every date in the system reads alike. */
export function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function weekdayName(dow: number): string {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dow]
}
