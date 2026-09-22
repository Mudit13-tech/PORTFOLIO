import { activity, type ActivityDay } from '~/data'

/**
 * The heatmap's model. Pure data — no React, no DOM — so the grids the
 * components draw are grids you can print and check.
 *
 * Two channels, two calendars. GitHub contributions and LeetCode submissions
 * are never drawn in the same cell and never added together: a commit count
 * plus a problem count is a number that means nothing, and one grid claiming to
 * show both makes a quiet week in one look like a busy week in the other.
 */

/* --------------------------------------------------------------- dates
 * Written out rather than formatted by Intl.
 *
 * `toLocaleString` resolves against whatever ICU data the runtime shipped
 * with, and Node's and the browser's do not always agree — CLDR moved en-US
 * "Sep" to "Sept" at one point. A month label that renders one way on the
 * server and another in the browser is a hydration mismatch, and in this
 * system a hydration mismatch costs the entire desktop.
 */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** "11 September 2026". */
export function longDate(iso: string): string {
  return `${Number(iso.slice(8, 10))} ${MONTHS_LONG[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`
}

export function weekdayName(dow: number): string {
  return WEEKDAYS[dow]
}

export const DOW = 7
export const WEEKS = Math.ceil(activity.days.length / DOW)

/** 0 = nothing happened. 1-4 index the ramp. */
export type Level = 0 | 1 | 2 | 3 | 4

export type ChannelId = 'commits' | 'submissions'

/**
 * Cut points for a ramp, taken from that channel's own distribution rather
 * than from an invented ceiling. Quartiles over the days that had any
 * activity, so one twenty-commit day cannot flatten every ordinary one to the
 * palest step.
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
  /** This channel's count for the day. */
  count: number
  level: Level
}

function streaks(has: (d: ActivityDay) => boolean) {
  let longest = 0
  let current = 0
  let endedOn: string | null = null
  for (const d of activity.days) {
    if (has(d)) {
      current += 1
      if (current > longest) {
        longest = current
        endedOn = d.date
      }
    } else {
      current = 0
    }
  }
  return { longest, endedOn }
}

export interface Channel {
  id: ChannelId
  /** What the section is called. */
  label: string
  /** The unit, for a sentence like "253 contributions". */
  unit: string
  /** How it was measured. Rendered next to the number, never omitted. */
  source: string
  href: string
  /** CSS custom properties, index 0 = empty. */
  ramp: string[]
  cuts: [number, number, number]
  cells: Cell[]
  total: number
  activeDays: number
  longest: number
  longestEndedOn: string | null
  best: ActivityDay
}

function build(
  id: ChannelId,
  label: string,
  unit: string,
  source: string,
  href: string,
  rampVar: string,
): Channel {
  const count = (d: ActivityDay) => (id === 'commits' ? d.commits : d.submissions)
  const cuts = quartiles(activity.days.map(count))
  const { longest, endedOn } = streaks((d) => count(d) > 0)

  return {
    id,
    label,
    unit,
    source,
    href,
    ramp: [
      'var(--hm-0)',
      `var(--hm-${rampVar}-1)`,
      `var(--hm-${rampVar}-2)`,
      `var(--hm-${rampVar}-3)`,
      `var(--hm-${rampVar}-4)`,
    ],
    cuts,
    cells: activity.days.map((day, i) => ({
      day,
      week: Math.floor(i / DOW),
      dow: i % DOW,
      count: count(day),
      level: level(count(day), cuts),
    })),
    total: activity.days.reduce((n, d) => n + count(d), 0),
    activeDays: activity.days.filter((d) => count(d) > 0).length,
    longest,
    longestEndedOn: endedOn,
    best: activity.days.reduce((b, d) => (count(d) > count(b) ? d : b)),
  }
}

export const channels: Record<ChannelId, Channel> = {
  commits: build(
    'commits',
    'GitHub',
    'contributions',
    'GitHub contributions collection',
    'https://github.com/Mudit13-tech',
    'gh',
  ),
  submissions: build(
    'submissions',
    'LeetCode',
    'submissions',
    'LeetCode submission calendar — submissions, not distinct problems',
    'https://leetcode.com/u/Mudit1306/',
    'lc',
  ),
}

export const channelList: Channel[] = [channels.commits, channels.submissions]

/** Month ticks: the first column of each month, skipping the crowded last two. */
export const monthTicks = (() => {
  const out: Array<{ label: string; week: number }> = []
  let last = ''
  for (let w = 0; w < WEEKS; w++) {
    const day = activity.days[w * DOW]
    if (!day) continue
    const label = MONTHS[Number(day.date.slice(5, 7)) - 1]
    if (label !== last && w < WEEKS - 2) {
      out.push({ label, week: w })
      last = label
    }
  }
  return out
})()

export const activityStats = {
  from: activity.from,
  to: activity.to,
  days: activity.days.length,
  commits: channels.commits.total,
  submissions: channels.submissions.total,
  /** Days with something on either channel. */
  activeDays: activity.days.filter((d) => d.commits > 0 || d.submissions > 0).length,
  busiest: activity.days.reduce((b, d) =>
    d.commits + d.submissions > b.commits + b.submissions ? d : b,
  ),
  ...streaks((d) => d.commits > 0 || d.submissions > 0),
} as const

/** Monthly totals — the table alternative to the grids, for anyone reading
 * them with a screen reader or with colour turned off. */
export const byMonth = (() => {
  const map = new Map<string, { label: string; commits: number; submissions: number; days: number }>()
  for (const d of activity.days) {
    const key = d.date.slice(0, 7)
    const entry = map.get(key) ?? {
      label: `${MONTHS_LONG[Number(d.date.slice(5, 7)) - 1]} ${d.date.slice(0, 4)}`,
      commits: 0,
      submissions: 0,
      days: 0,
    }
    entry.commits += d.commits
    entry.submissions += d.submissions
    if (d.commits > 0 || d.submissions > 0) entry.days += 1
    map.set(key, entry)
  }
  return [...map.entries()].map(([key, v]) => ({ key, ...v }))
})()
