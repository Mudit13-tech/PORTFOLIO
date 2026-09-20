/**
 * System identity.
 *
 * `deployedAt` is stamped by `scripts/stamp-build.mjs` at prebuild from the
 * real date, and the build string shown in the top bar and on the boot screen
 * is derived from it. There is no hand-written version number anywhere in this
 * system — an invented `v2.6` is the first thing a developer notices.
 */
export const meta = {
  systemName: 'MUDIT OS',
  tagline: 'There is no final version. Only the next build.',
  statusLine: 'MUDIT OS — still in development',
  description: 'A portfolio of things I built, broke, fixed, and learned from.',

  /** Stamped at build time. Format: YYYY-MM-DD. */
  deployedAt: '2026-09-20',

  /** The date the GitHub account was created — the uptime clock starts here. */
  since: '2025-06-06',

  /**
   * Channel readings, sampled 2026-09-16 from the GitHub contributions
   * collection and the LeetCode profile. Every one of these is rendered with
   * the method that produced it, never bare.
   */
  readings: {
    contributionsYear: 253,
    contributionActiveDays: 45,
    leetcodeSubmissionsYear: 390,
    leetcodeActiveDays: 87,
    solved: { easy: 90, medium: 68, hard: 8 },
    publicRepos: 15,
    sampledAt: '2026-09-16',
  },
} as const

/** 2026-09-20 → "2026.09.20". The build string, derived, never typed. */
export const buildVersion = meta.deployedAt.replace(/-/g, '.')
