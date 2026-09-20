import { failures, type Failure } from '~/data'
import { counts, projectFor, stability } from '@/lib/derived'
import {
  Chip,
  DraftNotice,
  Empty,
  ExternalLink,
  Field,
  Glyph,
  Rule,
  Section,
  SeverityTag,
  StatusTag,
} from '@/components/ui'

/**
 * FAILED_BUILDS.
 *
 * The tone is an incident report, not an apology. Errors do not apologise; they
 * explain. Every report ends in a fix and a lesson, because a failure with no
 * resolution reads as carelessness rather than as growth.
 */
export function FailuresApp() {
  return (
    <div className="p-5">
      <header className="flex items-baseline justify-between border-b border-subtle pb-2 mb-1">
        <h1 className="mono text-secondary">FAILED_BUILDS</h1>
        <span className="micro text-tertiary">
          {counts.failures} total · {counts.resolved} resolved
        </span>
      </header>

      <ul>
        {failures.map((f, i) => (
          <li key={f.id}>
            <a
              href={`/failures/${f.id}`}
              className="group flex items-center gap-3 py-2.5 border-b border-subtle/60 hover:bg-raised/60 -mx-2 px-2 rounded-sm"
            >
              <span className="mono text-[12px] text-tertiary shrink-0 tabular-nums">
                {String(i + 1).padStart(3, '0')}
              </span>
              <span className="mono text-[13px] text-primary truncate">{f.title}</span>
              <span className="ml-auto flex items-center gap-3 shrink-0">
                {f.resolved && <Glyph name="check" size={12} className="text-ok" />}
                <StatusTag status={f.status} />
              </span>
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-5 grid gap-1.5">
        <p className="mono text-[12px] text-tertiary">
          Stability {stability.display} — {stability.formula}.
        </p>
        <p className="mono text-[12px] text-tertiary">
          {counts.confirmed} of {counts.failures} confirmed by the author. The rest are
          drafted from real commits and marked as drafts until he says otherwise.
        </p>
      </div>
    </div>
  )
}

export function CrashReport({ failure }: { failure: Failure }) {
  const project = projectFor(failure)

  return (
    <article className="p-5">
      <header>
        <p className="field-label">Crash report</p>
        <h1 className="text-[24px] leading-[1.25] tracking-[-0.01em] text-primary mt-1">
          {failure.title}
        </h1>
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <StatusTag status={failure.status} />
          <SeverityTag level={failure.severity} />
          {failure.resolved && (
            <span className="inline-flex items-center gap-1 micro uppercase text-ok">
              <Glyph name="check" size={11} />
              resolved
            </span>
          )}
        </div>
      </header>

      {!failure.confirmed && (
        <div className="mt-4">
          <DraftNotice />
        </div>
      )}

      <Rule />

      <dl className="grid gap-2">
        <Field label="project">
          {project ? (
            <a href={`/projects/${project.id}`} className="mono text-info underline underline-offset-2">
              {project.name}
            </a>
          ) : (
            <span className="mono text-tertiary">standalone</span>
          )}
        </Field>
        <Field label="date">
          <span className="mono">{failure.date}</span>
        </Field>
        <Field label="cost">
          {failure.cost ? (
            <span className="mono">
              {failure.cost.value} {failure.cost.unit}
            </span>
          ) : (
            <Empty>not recorded</Empty>
          )}
        </Field>
      </dl>

      <Section title="What happened">
        <p>{failure.whatHappened}</p>
      </Section>

      <Section title="Cause">
        <p>{failure.cause}</p>
      </Section>

      <Section title="How I found it">
        <ol className="grid gap-1.5 not-prose">
          {failure.investigation.map((step, i) => (
            <li key={i} className="flex gap-2 text-[14px] text-secondary">
              <span className="mono text-tertiary shrink-0">→</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Fix">
        <p>{failure.fix}</p>
      </Section>

      <Section title="What I learned">
        <p className="text-primary">{failure.lesson}</p>
      </Section>

      {failure.commit && (
        <>
          <Rule />
          <div className="grid gap-1.5">
            <p className="field-label">The receipt</p>
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
        </>
      )}
    </article>
  )
}
