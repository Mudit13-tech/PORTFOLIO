import { projects, type Project } from '~/data'
import { counts } from '@/lib/derived'
import { Chip, StatusTag } from '@/components/ui'
import {
  AppHeader,
  AppPage,
  ArrowDot,
  Dash,
  DotNumber,
  Filter,
  Inset,
  Orb,
  Pill,
  Stat,
  Track,
} from '@/components/ui/kit'

/**
 * Projects, as a shelf of cards: each one tinted by its status, with the two
 * facts a visitor scans for — what it is built with and when — in the panel at
 * the bottom.
 *
 * No hooks beyond `useId` inside the filter, no 'use client'. This exact
 * component renders into the prerendered HTML at /projects and into the window
 * the desktop opens — one implementation, two render paths.
 */
export function ProjectsApp() {
  const wip = projects.filter((p) => p.status === 'wip').length
  const archived = projects.filter((p) => p.status === 'archived').length
  const years = projects.map((p) => p.year)
  const from = Math.min(...years)
  const to = Math.max(...years)

  return (
    <AppPage>
      <AppHeader
        app="projects"
        path="PROJECTS/"
        title="Projects"
        sub="Real repositories, each linked to the crash reports it produced."
      />

      <Orb tone="teal" className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-[15px] text-primary">Shipped so far</h2>
          <Pill>{from === to ? from : `${from}–${to}`}</Pill>
        </div>
        <div className="flex items-end gap-3 mt-4">
          <DotNumber value={String(counts.shipped).padStart(2, '0')} size={40} />
          <span className="text-[13px] text-secondary pb-1">
            of {counts.projects} applications
          </span>
        </div>
        <div className="mt-4">
          <Track
            value={counts.projects ? counts.shipped / counts.projects : 0}
            tone="teal"
            labels={[`${counts.shipped} shipped`, `${wip} in progress`, `${archived} archived`]}
          />
        </div>
      </Orb>

      <Filter
        label="Filter projects by status"
        options={[
          { value: 'shipped', label: 'Shipped', count: counts.shipped },
          { value: 'wip', label: 'In progress', count: wip },
          { value: 'archived', label: 'Archived', count: archived },
        ]}
      >
        <ul className="grid gap-3 @xl:grid-cols-2">
          {projects.map((p) => (
            <li key={p.id} data-f={p.status}>
              <ProjectCard project={p} />
            </li>
          ))}
        </ul>
      </Filter>
    </AppPage>
  )
}

function ProjectCard({ project: p }: { project: Project }) {
  return (
    <Orb href={`/projects/${p.id}`} tone={toneFor(p)} className="h-full flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[17px] leading-tight font-medium text-primary truncate">{p.name}</h2>
          <p className="text-[12.5px] text-tertiary mt-1 truncate">{p.type}</p>
        </div>
        <ArrowDot size={32} glyph="chevron" />
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
        <StatusTag status={p.status} />
        {p.stack.slice(0, 3).map((s) => (
          <Chip key={s}>{s}</Chip>
        ))}
      </div>

      <Inset className="mt-auto flex items-end gap-3">
        <Stat label="Role">
          <span className="text-[13px] text-primary truncate">{p.role}</span>
        </Stat>
        <Dash />
        <Stat label="Since" align="right">
          <DotNumber value={p.year} size={17} />
        </Stat>
      </Inset>
    </Orb>
  )
}

/** Shipped work reads green, work in progress amber — the same as its tag. */
function toneFor(p: Project) {
  return p.status === 'shipped' ? 'ok' : p.status === 'wip' ? 'warn' : 'neutral'
}

/* The detail page lives in its own file: the case study. */
export { ProjectDetail } from './project-detail'
