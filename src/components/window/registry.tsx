'use client'

import dynamic from 'next/dynamic'
import { bin, experiments, failures, projects, skills } from '~/data'
import type { AppId } from '@/os/types'

/**
 * The app registry. Adding an application is one entry here and one component —
 * nothing else in the system needs to know it exists.
 *
 * Every `dynamic()` call lives in this file, and this file is `'use client'`,
 * because `ssr: false` is not allowed in a Server Component and a Server
 * Component's dynamic import does not code-split at all. Projects loads eagerly
 * because it is the first window most visitors open; everything else arrives on
 * first use.
 */

const load = {
  projects: dynamic(() => import('@/apps/projects').then((m) => m.ProjectsApp)),
  failures: dynamic(() => import('@/apps/failures').then((m) => m.FailuresApp)),
  skills: dynamic(() => import('@/apps/skills').then((m) => m.SkillsApp)),
  experiments: dynamic(() => import('@/apps/misc').then((m) => m.ExperimentsApp)),
  monitor: dynamic(() => import('@/apps/misc').then((m) => m.MonitorApp)),
  about: dynamic(() => import('@/apps/misc').then((m) => m.AboutApp)),
  contact: dynamic(() => import('@/apps/misc').then((m) => m.ContactApp)),
  bin: dynamic(() => import('@/apps/misc').then((m) => m.BinApp)),
  terminal: dynamic(() => import('@/apps/terminal').then((m) => m.TerminalApp), { ssr: false }),
} satisfies Record<AppId, React.ComponentType>

const detail = {
  projects: dynamic(() => import('@/apps/projects').then((m) => m.ProjectDetail)),
  failures: dynamic(() => import('@/apps/failures').then((m) => m.CrashReport)),
  skills: dynamic(() => import('@/apps/skills').then((m) => m.SkillDetail)),
  experiments: dynamic(() => import('@/apps/misc').then((m) => m.ExperimentDetail)),
}

/** Render one app, optionally focused on a single record. */
export function AppView({ id, payload }: { id: AppId; payload: string | null }) {
  if (payload) {
    if (id === 'projects') {
      const project = projects.find((p) => p.id === payload)
      if (project) {
        const C = detail.projects
        return <C project={project} />
      }
    }
    if (id === 'failures') {
      const failure = failures.find((f) => f.id === payload)
      if (failure) {
        const C = detail.failures
        return <C failure={failure} />
      }
    }
    if (id === 'skills') {
      const skill = skills.find((s) => s.id === payload)
      if (skill) {
        const C = detail.skills
        return <C skill={skill} />
      }
    }
    if (id === 'experiments') {
      const experiment = experiments.find((e) => e.id === payload)
      if (experiment) {
        const C = detail.experiments
        return <C experiment={experiment} />
      }
    }
    if (id === 'bin' && bin.some((b) => b.id === payload)) {
      const C = load.bin
      return <C />
    }
  }

  const C = load[id]
  return <C />
}
