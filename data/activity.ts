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
export const activity = snapshot as unknown as ActivityWindow
