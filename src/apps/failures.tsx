import { failures, type Failure } from '~/data'
import { counts, projectFor, stability } from '@/lib/derived'
import {
  Chip,
  DraftNotice,
  ExternalLink,
  Glyph,
  Section,
  SeverityTag,
  StatusTag,
} from '@/components/ui'
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
 * FAILED_BUILDS.
 *
 * The tone is an incident report, not an apology. Errors do not apologise; they
 * explain. Every report ends in a fix and a lesson, because a failure with no
 * resolution reads as carelessness rather than as growth.
 */
export function FailuresApp() {
  const bySeverity = (level: Failure['severity']) => failures.filter((f) => f.severity === level).length

  return (
    <AppPage>
      <AppHeader
        path="FAILED_BUILDS/"
        title="Crash reports"
        sub="What broke, why, how it was found, and what changed after."
      />

      <Orb tone="error" className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-[15px] text-primary">Stability</h2>
          <Pill>{stability.formula}</Pill>
        </div>
        <div className="flex items-end gap-3 mt-4">
          <DotNumber value={stability.display} size={40} />
          <span className="text-[13px] text-secondary pb-1">
            {counts.resolved} of {counts.failures} resolved
          </span>
        </div>
        <div className="mt-4">
          <Track
            value={stability.value}
            tone="error"
            labels={[`${bySeverity('high')} high`, `${bySeverity('medium')} medium`, `${bySeverity('low')} low`]}
          />
        </div>
      </Orb>

      <Filter
        label="Filter crash reports by severity"
        options={[
          { value: 'high', label: 'High', count: bySeverity('high') },
          { value: 'medium', label: 'Medium', count: bySeverity('medium') },
          { value: 'low', label: 'Low', count: bySeverity('low') },
        ]}
      >
        <ul className="grid gap-2">
          {failures.map((f, i) => (
            <li key={f.id} data-f={f.severity}>
              <a href={`/failures/${f.id}`} className="tile flex items-center gap-3 px-3.5 py-3">
                <span className="hidden @xs:block text-tertiary">
                  <DotNumber value={String(i + 1).padStart(3, '0')} size={11} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] leading-snug text-primary">{f.title}</span>
                  <span className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <StatusTag status={f.status} />
                    <SeverityTag level={f.severity} />
                    {f.resolved && (
                      <span className="pill pill-ok">
                        <Glyph name="check" size={11} />
                        resolved
                      </span>
                    )}
                  </span>
                </span>
                <ArrowDot size={28} glyph="chevron" />
              </a>
            </li>
          ))}
        </ul>
      </Filter>

      <p className="mono text-[12px] text-tertiary mt-5">
        {counts.confirmed} of {counts.failures} confirmed by the author. The rest are drafted
        from real commits and marked as drafts until he says otherwise.
      </p>
    </AppPage>
  )
}

export function CrashReport({ failure }: { failure: Failure }) {
  const project = projectFor(failure)

  return (
    <AppPage>
      <article>
        <Orb tone="error" className="mb-5">
          <p className="field-label">Crash report · {failure.date}</p>
          <h1 className="text-[22px] @lg:text-[26px] leading-[1.2] tracking-[-0.015em] font-medium text-primary mt-2">
            {failure.title}
          </h1>
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <StatusTag status={failure.status} />
            <SeverityTag level={failure.severity} />
            {failure.resolved && (
              <span className="pill pill-ok">
                <Glyph name="check" size={11} />
                resolved
              </span>
            )}
          </div>

          <Inset className="mt-5 flex items-end gap-3">
            <Stat label="Project">
              {project ? (
                <a href={`/projects/${project.id}`} className="text-[13px] text-primary underline underline-offset-2 decoration-strong truncate">
                  {project.name}
                </a>
              ) : (
                <span className="text-[13px] text-tertiary">standalone</span>
              )}
            </Stat>
            <Dash />
            <Stat label="Cost" align="right">
              {failure.cost ? (
                <span className="inline-flex items-end gap-1">
                  <DotNumber value={failure.cost.value} size={17} />
                  <span className="text-[12px] text-secondary leading-none">{failure.cost.unit}</span>
                </span>
              ) : (
                <span className="text-[13px] text-tertiary">not recorded</span>
              )}
            </Stat>
          </Inset>
        </Orb>

        {!failure.confirmed && (
          <div className="mb-6">
            <DraftNotice />
          </div>
        )}

        <Section title="What happened">
          <p>{failure.whatHappened}</p>
        </Section>

        <Section title="Cause">
          <p>{failure.cause}</p>
        </Section>

        <Section title="How I found it">
          <ol className="timeline tone-error not-prose">
            {failure.investigation.map((step, i) => (
              <li key={i} className="text-[14px] leading-[1.6] text-secondary">
                {step}
              </li>
            ))}
          </ol>
        </Section>

        <Section title="Fix">
          <p>{failure.fix}</p>
        </Section>

        <Section title="What I learned">
          <div className="tile p-4 not-prose">
            <p className="text-[15px] leading-[1.6] text-primary">{failure.lesson}</p>
          </div>
        </Section>

        {failure.commit && (
          <Section title="The receipt">
            <div className="tile p-4 grid gap-2 not-prose">
              <div className="flex flex-wrap items-center gap-2">
                <Chip>{failure.commit.repo}</Chip>
                <ExternalLink
                  href={`https://github.com/Mudit13-tech/${failure.commit.repo}/commit/${failure.commit.sha}`}
                >
                  <span className="mono">{failure.commit.sha}</span>
                </ExternalLink>
              </div>
              <p className="mono text-[12px] text-tertiary">“{failure.commit.message}”</p>
            </div>
          </Section>
        )}

      </article>
    </AppPage>
  )
}
