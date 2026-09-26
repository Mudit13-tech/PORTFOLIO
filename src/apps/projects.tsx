import { projects, type Project } from '~/data'
import { counts, failuresFor } from '@/lib/derived'
import { Chip, Empty, Glyph, Section, StatusTag } from '@/components/ui'
import {
  AppHeader,
  AppPage,
  ArrowDot,
  Dash,
  DotNumber,
  Figure,
  Filter,
  Inset,
  Orb,
  Pill,
  RoundLink,
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
    <Orb href={`/projects/${p.id}`} tone={toneFor(p)}className="h-full flex flex-col">
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

export function ProjectDetail({ project }: { project: Project }) {
  const linked = failuresFor(project)

  return (
    <AppPage>
      <article>
        <Orb tone={toneFor(project)} className="mb-6">
          <p className="field-label">Project · {project.type}</p>
          <h1 className="text-[26px] @lg:text-[30px] leading-[1.1] tracking-[-0.02em] font-medium text-primary mt-2">
            {project.name}
          </h1>
          <div className="flex flex-wrap gap-1.5 mt-3">
            <StatusTag status={project.status} />
            <Pill>{project.role}</Pill>
          </div>

          <Inset className="mt-5 flex items-end gap-3">
            <Stat label="Stack">
              <span className="text-[13px] text-primary truncate">{project.stack.slice(0, 3).join(' · ')}</span>
            </Stat>
            <Dash />
            <Stat label="First commit" align="right">
              <DotNumber value={project.year} size={19} />
            </Stat>
          </Inset>

          <div className="flex flex-wrap gap-2 mt-4">
            {project.links.source ? (
              <RoundLink href={project.links.source}>Source</RoundLink>
            ) : (
              <Empty>No public source</Empty>
            )}
            {project.links.live ? (
              <RoundLink href={project.links.live}>Live</RoundLink>
            ) : (
              <Empty>No live demo — it runs locally or on a device</Empty>
            )}
          </div>
        </Orb>

        <Section title="The problem">
          <p>{project.problem}</p>
        </Section>

        <Section title="How it works">
          <p>{project.architecture}</p>
        </Section>

        <Section title="What I built">
          {project.contribution.startsWith('TODO') ? (
            <Empty>{project.contribution.replace(/^TODO — /, '')}</Empty>
          ) : (
            <p>{project.contribution}</p>
          )}
        </Section>

        {project.evidence.length > 0 && (
          <Section title="Measured">
            <ul className="grid gap-2.5 @lg:grid-cols-2 not-prose">
              {project.evidence.map((e) => (
                <li key={e.label} className="tile p-3.5">
                  <p className="text-[12px] text-tertiary">{e.label}</p>
                  <div className="mt-2">
                    <Figure value={e.value} />
                  </div>
                  <p className="micro text-tertiary mt-2">{e.source}</p>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="What broke">
          {linked.length === 0 ? (
            <Empty>No crash reports filed against this project yet.</Empty>
          ) : (
            <ul className="grid gap-2 not-prose">
              {linked.map((f) => (
                <li key={f.id}>
                  <a href={`/failures/${f.id}`} className="tile flex items-center gap-3 px-3.5 py-3">
                    <Glyph name="warn" size={14} className="text-error shrink-0" />
                    <span className="text-[14px] text-primary">{f.title}</span>
                    <span className="ml-auto">
                      <ArrowDot size={26} glyph="chevron" />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {project.retrospective && (
          <Section title="What I'd do differently">
            {project.retrospective.startsWith('TODO') ? (
              <Empty>{project.retrospective.replace(/^TODO — /, '')}</Empty>
            ) : (
              <p>{project.retrospective}</p>
            )}
          </Section>
        )}

        {project.stack.length > 3 && (
          <Section title="Full stack">
            <div className="flex flex-wrap gap-1.5 not-prose">
              {project.stack.map((s) => (
                <Chip key={s}>{s}</Chip>
              ))}
            </div>
          </Section>
        )}
      </article>
    </AppPage>
  )
}
