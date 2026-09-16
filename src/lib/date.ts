export const DAY_MS = 86_400_000

export function iso(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function parseIso(s: string): Date {
  return new Date(`${s}T00:00:00Z`)
}

export function shift(s: string, days: number): string {
  return iso(new Date(parseIso(s).getTime() + days * DAY_MS))
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const monthShort = (s: string) => MONTHS[parseIso(s).getUTCMonth()]
export const weekdayLong = (i: number) => WEEKDAYS[i]

/** "Mon 17 Feb 2026" — no all-caps, no ambiguity between day and month. */
export function longDate(s: string): string {
  const d = parseIso(s)
  return `${WEEKDAYS[d.getUTCDay()].slice(0, 3)} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/**
 * Age in days, signed and negative into the past — the log column reads like
 * dmesg's monotonic clock without pretending to be one.
 */
export function ageDays(t: string, now: number): number {
  return (new Date(t).getTime() - now) / DAY_MS
}
