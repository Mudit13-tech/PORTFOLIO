import {
  bin,
  buildVersion,
  experiments,
  failures,
  meta,
  projects,
  skills,
  type AppId,
  type Failure,
  type Project,
  type Reading,
  type Skill,
} from '~/data'

/**
 * Every count, every cross-link, every metric in the system.
 *
 * No component types a number that describes the content. If the boot screen
 * says nine crash reports, it is because `failures.length === 9`, and when a
 * tenth is added the boot screen, the desktop icon, the dock and the system
 * monitor all change together because they all read from here.
 */

export const counts = {
  projects: projects.length,
  failures: failures.length,
  skills: skills.length,
  experiments: experiments.length,
  bin: bin.length,
  shipped: projects.filter((p) => p.status === 'shipped').length,
  resolved: failures.filter((f) => f.resolved).length,
  confirmed: failures.filter((f) => f.confirmed).length,
} as const

/** Counts shown under each desktop icon. null means the icon carries no count. */
export function countFor(id: AppId): number | null {
  switch (id) {
    case 'projects':
      return counts.projects
    case 'failures':
      return counts.failures
    case 'skills':
      return counts.skills
    case 'experiments':
      return counts.experiments
    case 'bin':
      return counts.bin
    default:
      return null
  }
}

/**
 * Stability, defined rather than asserted: resolved failures over total
 * failures. The interface shows this formula next to the number, because a
 * percentage with no definition is decoration.
 */
export const stability = {
  value: counts.failures === 0 ? 1 : counts.resolved / counts.failures,
  formula: 'resolved failures ÷ total failures',
  get display() {
    return `${Math.round(this.value * 100)}%`
  },
}

/** Whole months between the first commit and the last deploy. */
export function uptime(): string {
  const from = new Date(`${meta.since}T00:00:00Z`)
  const to = new Date(`${meta.deployedAt}T00:00:00Z`)
  let months =
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth())
  if (to.getUTCDate() < from.getUTCDate()) months -= 1
  const years = Math.floor(months / 12)
  const rest = months % 12
  const parts: string[] = []
  if (years) parts.push(`${years} year${years === 1 ? '' : 's'}`)
  if (rest) parts.push(`${rest} month${rest === 1 ? '' : 's'}`)
  return parts.join(', ') || 'under a month'
}

/* ------------------------------------------------------------- cross-links */

export function failuresFor(project: Project): Failure[] {
  return project.failureIds
    .map((id) => failures.find((f) => f.id === id))
    .filter((f): f is Failure => Boolean(f))
}

export function projectFor(failure: Failure): Project | null {
  return failure.projectId ? (projects.find((p) => p.id === failure.projectId) ?? null) : null
}

export function projectsFor(skill: Skill): Project[] {
  return skill.projectIds
    .map((id) => projects.find((p) => p.id === id))
    .filter((p): p is Project => Boolean(p))
}

export function failuresForSkill(skill: Skill): Failure[] {
  return skill.failureIds
    .map((id) => failures.find((f) => f.id === id))
    .filter((f): f is Failure => Boolean(f))
}

export function skillsByCategory() {
  const order = ['frontend', 'backend', 'language', 'tooling'] as const
  return order.map((category) => ({
    category,
    modules: skills.filter((s) => s.category === category),
  }))
}

/**
 * Referential integrity, checked rather than trusted. Called by the prebuild
 * script so a failureId that points at nothing fails the build instead of
 * rendering as a dead link.
 */
export function danglingReferences(): string[] {
  const problems: string[] = []
  const failureIds = new Set(failures.map((f) => f.id))
  const projectIds = new Set(projects.map((p) => p.id))

  for (const p of projects) {
    for (const id of p.failureIds) {
      if (!failureIds.has(id)) problems.push(`projects/${p.id} → failures/${id} does not exist`)
    }
  }
  for (const f of failures) {
    if (f.projectId && !projectIds.has(f.projectId)) {
      problems.push(`failures/${f.id} → projects/${f.projectId} does not exist`)
    }
  }
  for (const s of skills) {
    for (const id of s.projectIds) {
      if (!projectIds.has(id)) problems.push(`skills/${s.id} → projects/${id} does not exist`)
    }
    for (const id of s.failureIds) {
      if (!failureIds.has(id)) problems.push(`skills/${s.id} → failures/${id} does not exist`)
    }
  }
  return problems
}

/* --------------------------------------------------------- system readings */

const r = meta.readings

/** The System Monitor rows. Every one carries how it was measured. */
export const readings: Reading[] = [
  {
    id: 'projects',
    label: 'Projects',
    value: counts.projects,
    display: String(counts.projects),
    source: 'data/projects.ts, one entry per real repository',
    href: '/projects',
  },
  {
    id: 'failures',
    label: 'Crash reports',
    value: counts.failures,
    display: String(counts.failures),
    source: 'data/failures.ts, each drafted from a named commit',
    href: '/failures',
  },
  {
    id: 'experiments',
    label: 'Experiments',
    value: counts.experiments,
    display: String(counts.experiments),
    source: 'data/experiments.ts',
    href: '/experiments',
  },
  {
    id: 'solved',
    label: 'Problems solved',
    value: r.solved.easy + r.solved.medium + r.solved.hard,
    display: String(r.solved.easy + r.solved.medium + r.solved.hard),
    source: `LeetCode profile, lifetime accepted, sampled ${r.sampledAt}`,
    href: null,
  },
  {
    id: 'contributions',
    label: 'Contributions, 1 yr',
    value: r.contributionsYear,
    display: String(r.contributionsYear),
    source: `GitHub contributions collection, trailing 371 days, sampled ${r.sampledAt}`,
    href: 'https://github.com/Mudit13-tech',
  },
  {
    id: 'repos',
    label: 'Public repositories',
    value: r.publicRepos,
    display: String(r.publicRepos),
    source: `GitHub API public_repos, sampled ${r.sampledAt}`,
    href: 'https://github.com/Mudit13-tech?tab=repositories',
  },
]

/** The largest reading, so the monitor's bars have a real scale. */
export const readingCeiling = Math.max(...readings.map((x) => x.value))

export const system = {
  build: buildVersion,
  uptime: uptime(),
  lastDeploy: meta.deployedAt,
  stability,
} as const

/** The boot screen's mount lines. Counts come from here, never from prose. */
export const bootLines = [
  { label: 'Initializing developer', value: 'OK' },
  { label: 'Mounting /projects', value: `${counts.projects} found` },
  { label: 'Mounting /experiments', value: `${counts.experiments} found` },
  { label: 'Mounting /failures', value: `${counts.failures} found` },
  { label: 'Loading skills', value: `${counts.skills} modules` },
  { label: 'Checking system stability', value: stability.display },
] as const
