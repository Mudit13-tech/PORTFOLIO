export type Difficulty = 'easy' | 'medium' | 'hard'
export type ChannelId = 'github' | 'leetcode'
export type ChannelState = 'ok' | 'degraded' | 'offline'

/** One day of the trailing year, merged from both channels. */
export interface Day {
  /** ISO date, YYYY-MM-DD, in the snapshot's reference zone. */
  date: string
  /** Channel 0. Commits and other GitHub contributions. */
  commits: number
  /** Channel 1. Accepted LeetCode submissions. */
  solved: number
  /**
   * Hardest difficulty accepted that day. Only known for days covered by the
   * recent-submission window; null elsewhere, and rendered as absent rather
   * than guessed.
   */
  hardest: Difficulty | null
}

export interface Channel {
  id: ChannelId
  label: string
  user: string
  state: ChannelState
  /** Total events observed across the window. */
  total: number
  /** Days with at least one event. */
  activeDays: number
  /** Human-readable reason, shown when state is not ok. */
  note: string | null
}

export type EventKind = 'commit' | 'solved' | 'contest' | 'repo' | 'system'

export interface LogEvent {
  /** ISO timestamp. */
  t: string
  kind: EventKind
  channel: ChannelId | 'system'
  text: string
  meta: string | null
  href: string | null
}

export interface Snapshot {
  /** When this snapshot was taken. */
  generatedAt: string
  /** First and last day of the 53x7 window. */
  from: string
  to: string
  /** Exactly WEEKS * DAYS entries, Sunday-aligned, oldest first, column-major. */
  days: Day[]
  channels: Channel[]
  /** Lifetime accepted counts by difficulty, when the channel reports them. */
  difficulty: { easy: number; medium: number; hard: number } | null
  events: LogEvent[]
  /** True when this is the checked-in fallback rather than measured data. */
  fallback: boolean
}
