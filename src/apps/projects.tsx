import { projects, type Project } from '~/data'
import { failuresFor } from '@/lib/derived'
import { Chip, Empty, ExternalLink, Field, Glyph, Rule, Section, StatusTag } from '@/components/ui'

/**
 * Projects, as a file browser rather than a card grid.
 *
 * No hooks, no 'use client'. This exact component renders into the prerendered
 * HTML at /projects and into the window the desktop opens — one implementation,
 * two render paths.
 */
export function ProjectsApp() {
  return (
    <div className="p-5">
      <header className="flex items-baseline justify-between border-b border-subtle pb-2 mb-1">
        <h1 className="mono text-secondary">PROJECTS/</h1>
        <span className="micro text-tertiary">{projects.length} applications</span>
      </header>

      <ul>
        {projects.map((p) => (
          <li key={p.id}>
            <a
              href={`/projects/${p.id}`}
              className="group flex items-center gap-3 py-2.5 border-b border-subtle/60 hover:bg-raised/60 -mx-2 px-2 rounded-sm"
            >
              <Glyph name="projects" className="text-tertiary group-hover:text-ok shrink-0" />
              <span className="mono text-primary shrink-0">{p.name}</span>
              <span className="mono text-[12px] text-tertiary truncate hidden sm:block">
                {p.stack.slice(0, 3).join(' · ')}
              </span>
              <span className="ml-auto flex items-center gap-3 shrink-0">
                <StatusTag status={p.status} />
                <Glyph name="chevron" size={12} className="text-tertiary" />
              </span>
            </a>
          </li>
        ))}
      </ul>

      <p className="mono text-[12px] text-tertiary mt-4">
        Every project links the crash reports it produced. That cross-link is what
        makes the failure log something other than decoration.
      </p>
    </div>
  )
}

export function ProjectDetail({ project }: { project: Project }) {
  const linked = failuresFor(project)

  return (
    <article className="p-5">
      <header>
        <h1 className="text-[24px] leading-[1.25] tracking-[-0.01em] text-primary">{project.name}</h1>
        <p className="mono text-[12px] text-tertiary mt-1">
          {project.type} · {project.year} · {project.role}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {project.stack.map((s) => (
            <Chip key={s}>{s}</Chip>
          ))}
        </div>
        <div className="mt-3">
          <StatusTag status={project.status} />
        </div>
      </header>

      <Rule />

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
          <dl className="grid gap-2 not-prose">
            {project.evidence.map((e) => (
              <Field key={e.label} label={e.label} hint={e.source}>
                <span className="mono">{e.value}</span>
              </Field>
            ))}
          </dl>
        </Section>
      )}

      <Section title="What broke">
        {linked.length === 0 ? (
          <Empty>No crash reports filed against this project yet.</Empty>
        ) : (
          <ul className="grid gap-1.5 not-prose">
            {linked.map((f) => (
              <li key={f.id}>
                <a
                  href={`/failures/${f.id}`}
                  className="flex items-center gap-2 py-1.5 px-2 -mx-2 rounded-sm hover:bg-raised/60"
                >
                  <Glyph name="warn" size={13} className="text-error shrink-0" />
                  <span className="mono text-[13px] text-primary">{f.title}</span>
                  <Glyph name="chevron" size={11} className="ml-auto text-tertiary" />
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

      <Rule />

      <div className="flex flex-wrap gap-4 mono text-[13px]">
        {project.links.source ? (
          <ExternalLink href={project.links.source}>Source</ExternalLink>
        ) : (
          <Empty>No public source</Empty>
        )}
        {project.links.live ? (
          <ExternalLink href={project.links.live}>Live</ExternalLink>
        ) : (
          <Empty>No live demo — it runs locally or on a device</Empty>
        )}
      </div>
    </article>
  )
}
