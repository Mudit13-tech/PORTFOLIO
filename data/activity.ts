import snapshot from './activity.json'
import type { ActivityWindow } from './types'

/**
 * A year of real activity, committed as a snapshot rather than fetched at
 * render time.
 *
 * Two channels — GitHub contributions and LeetCode submissions — sampled into
 * one 53-week window so the heatmap can show them in the same cell. A live API
 * call here would mean a portfolio that renders an empty grid the day a rate
 * limit is hit, which is the worst possible moment for it to happen.
 */
export const activity: ActivityWindow = {
  generatedAt: snapshot.generatedAt,
  from: snapshot.from,
  to: snapshot.to,
  // The snapshot calls the LeetCode column `solved`. It is not: it is the
  // submission calendar's daily count. Renamed here, at the one place the file
  // is read, so nothing downstream can repeat the claim.
  days: snapshot.days.map((d) => ({
    date: d.date,
    commits: d.commits,
    submissions: d.solved,
    hardest: (d.hardest ?? null) as ActivityWindow['days'][number]['hardest'],
  })),
}
