import {
  bin,
  channels,
  experiments,
  meta,
  profile,
  type Experiment,
} from '~/data'
import { counts, readingCeiling, readings, stability, system } from '@/lib/derived'
import { activityStats } from '@/lib/activity'
import { Chip, Empty, ExternalLink, Field, Glyph, Meter, Rule, Section } from '@/components/ui'
import { Heatmap } from '@/components/system/Heatmap'
import { RestoreAll } from '@/components/system/RestoreAll'
import { CopyButton } from '@/components/system/CopyButton'

/* ------------------------------------------------------------ experiments */

export function ExperimentsApp() {
  const byCategory = experiments.reduce<Record<string, Experiment[]>>((acc, e) => {
    ;(acc[e.category] ??= []).push(e)
    return acc
  }, {})

  return (
    <div className="p-5">
      <header className="flex items-baseline justify-between border-b border-subtle pb-2 mb-3">
        <h1 className="mono text-secondary">EXPERIMENTS/</h1>
        <span className="micro text-tertiary">{experiments.length} builds</span>
      </header>

      {Object.entries(byCategory).map(([category, items]) => (
        <section key={category} className="mb-4">
          <h2 className="field-label mb-1">
            {category} · {items.length}
          </h2>
          <ul>
            {items.map((e) => (
              <li key={e.id}>
                <a
                  href={`/experiments/${e.id}`}
                  className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-sm hover:bg-raised/60 border-b border-subtle/40"
                >
                  <Glyph name="experiments" size={13} className="text-tertiary shrink-0" />
                  <span className="mono text-[13px] text-primary truncate">{e.name}</span>
                  <span className="ml-auto mono text-[12px] text-tertiary shrink-0">{e.year}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

export function ExperimentDetail({ experiment }: { experiment: Experiment }) {
  const todo = (s: string) => s.startsWith('TODO')
  return (
    <article className="p-5">
      <header>
        <h1 className="text-[24px] leading-[1.25] tracking-[-0.01em] text-primary">{experiment.name}</h1>
        <p className="mono text-[12px] text-tertiary mt-1">
          {experiment.category} · {experiment.year}
        </p>
      </header>

      <Rule />

      <dl className="grid gap-4">
        <Field label="tested">{experiment.tested}</Field>
        <Field label="why">{experiment.why}</Field>
        <Field label="result">
          {todo(experiment.result) ? <Empty>{experiment.result.replace(/^TODO — /, '')}</Empty> : experiment.result}
        </Field>
        <Field label="learned">
          {todo(experiment.learned) ? <Empty>not written up yet</Empty> : experiment.learned}
        </Field>
      </dl>

      {experiment.source && (
        <>
          <Rule />
          <ExternalLink href={experiment.source}>Source</ExternalLink>
        </>
      )}
    </article>
  )
}

/* -------------------------------------------------------------------- bin */

export function BinApp() {
  return (
    <div className="p-5">
      <header className="flex items-baseline justify-between border-b border-subtle pb-2 mb-1">
        <h1 className="mono text-secondary">RECYCLE_BIN</h1>
        <RestoreAll />
      </header>

      <ul>
        {bin.map((item) => (
          <li key={item.id} className="py-3 border-b border-subtle/50">
            <div className="flex items-center gap-2">
              <Glyph name={item.kind === 'folder' ? 'projects' : 'bin'} size={13} className="text-tertiary" />
              <span className="mono text-[13px] text-primary">{item.name}</span>
              <span className="ml-auto mono text-[12px] text-tertiary">{item.meta}</span>
            </div>
            <p className="prose-col text-[14px] text-secondary mt-1.5 pl-5">{item.story}</p>
          </li>
        ))}
      </ul>

      <p className="mono text-[12px] text-tertiary mt-4">
        Emptying is disabled. Nothing here is really gone.
      </p>
    </div>
  )
}

/* ---------------------------------------------------------------- monitor */

export function MonitorApp() {
  return (
    <div className="p-5">
      <header className="flex items-baseline justify-between border-b border-subtle pb-2 mb-4">
        <h1 className="mono text-secondary">SYSTEM MONITOR</h1>
        <span className="micro text-ok">live</span>
      </header>

      <ul className="grid gap-3">
        {readings.map((r) => {
          const row = (
            <>
              <div className="flex items-baseline gap-3">
                <span className="mono text-[13px] text-primary w-44 shrink-0 truncate">{r.label}</span>
                <span className="mono text-[13px] text-ok tabular-nums w-14 shrink-0">{r.display}</span>
                <span className="flex-1">
                  <Meter value={r.value} max={readingCeiling} />
                </span>
              </div>
              <p className="micro text-tertiary mt-0.5 pl-0 sm:pl-[11.75rem]">{r.source}</p>
            </>
          )
          return (
            <li key={r.id}>
              {r.href ? (
                <a
                  href={r.href}
                  {...(r.href.startsWith('http') ? { target: '_blank', rel: 'noreferrer', 'data-native': 'true' } : {})}
                  className="block px-2 -mx-2 py-1 rounded-sm hover:bg-raised/60"
                >
                  {row}
                </a>
              ) : (
                <div className="px-2 -mx-2 py-1">{row}</div>
              )}
            </li>
          )
        })}
      </ul>

      <Rule />

      <section>
        <header className="flex items-baseline justify-between gap-3 mb-3">
          <h2 className="field-label">
            Activity · {activityStats.from} → {activityStats.to}
          </h2>
          <span className="micro text-tertiary">
            {activityStats.activeDays} of {activityStats.days} days
          </span>
        </header>

        <Heatmap />

        <p className="micro text-tertiary mt-3 term-col">
          Upper-left triangle: GitHub contributions. Lower-right: LeetCode
          submissions. The two are drawn side by side and never added together —
          a commit count plus a problem count is a number that means nothing.
          Each ramp steps from its own quartiles over this window, so the colour
          reads as busy-for-this-person rather than busy-against-an-invented-ceiling.
        </p>
      </section>

      <Rule />

      <dl className="grid gap-2">
        <Field label="longest streak" hint={`ended ${activityStats.endedOn ?? 'n/a'}`}>
          <span className="mono">{activityStats.longest} days</span>
        </Field>
        <Field label="uptime" hint={`since the first commit, ${meta.since}`}>
          <span className="mono">{system.uptime}</span>
        </Field>
        <Field label="last deploy">
          <span className="mono">{system.lastDeploy}</span>
        </Field>
        <Field label="stability" hint={stability.formula}>
          <span className="mono text-ok">{stability.display}</span>
          <span className="mono text-tertiary">
            {' '}
            — {counts.resolved} of {counts.failures}
          </span>
        </Field>
        <Field label="build">
          <span className="mono">{system.build}</span>
        </Field>
      </dl>

      <p className="mono text-[12px] text-tertiary mt-4">
        Every number links to its source. Nothing here is typed into a component —
        the counts are the length of a data file, and the channel readings carry
        the date they were sampled.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ about */

export function AboutApp() {
  return (
    <div className="p-5">
      <header className="border-b border-subtle pb-2 mb-4">
        <h1 className="mono text-secondary">USER PROFILE</h1>
      </header>

      <dl className="grid gap-2">
        <Field label="name">{profile.name}</Field>
        <Field label="role">{profile.role}</Field>
        <Field label="discipline">
          {profile.discipline}
          <span className="block mono text-[12px] text-tertiary">{profile.institution}</span>
        </Field>
        <Field label="location">
          {profile.location ?? <Empty>not published</Empty>}
        </Field>
        <Field label="status">
          {profile.status ?? (
            <span className="inline-flex items-center gap-1.5 text-ok">
              <span aria-hidden="true">●</span> building
            </span>
          )}
        </Field>
      </dl>

      <Section title={`Currently · as of ${profile.currently.asOf}`}>
        <ul className="grid gap-1 not-prose">
          {profile.currently.items.map((c) => (
            <li key={c} className="flex gap-2 text-[14px]">
              <span className="mono text-tertiary">→</span>
              {c}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Interests">
        <div className="flex flex-wrap gap-1.5 not-prose">
          {profile.interests.map((i) => (
            <Chip key={i}>{i}</Chip>
          ))}
        </div>
      </Section>

      <Section title="Process">
        <p className="text-primary">{profile.process}</p>
      </Section>

      <Rule />

      <div className="flex flex-wrap gap-4 mono text-[13px]">
        <ExternalLink href={profile.links.github}>GitHub</ExternalLink>
        <ExternalLink href={profile.links.leetcode}>LeetCode</ExternalLink>
        {profile.links.resume ? (
          <ExternalLink href={profile.links.resume}>Résumé</ExternalLink>
        ) : (
          <Empty>Résumé not uploaded yet</Empty>
        )}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- contact */

export function ContactApp() {
  const reachable = channels.filter((c) => c.href)

  return (
    <div className="p-5">
      <header className="border-b border-subtle pb-2 mb-4">
        <h1 className="mono text-secondary">COMMUNICATION CHANNEL</h1>
      </header>

      <dl className="grid gap-2 mb-5">
        <Field label="status">
          <span className="inline-flex items-center gap-1.5 text-ok">
            <span aria-hidden="true">●</span>
            {reachable.length > 0 ? 'ready to receive' : 'no channel published yet'}
          </span>
        </Field>
      </dl>

      <h2 className="field-label mb-2">Select channel</h2>
      <ul className="grid gap-1.5">
        {channels.map((c) => (
          <li
            key={c.id}
            className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-sm border border-subtle/50"
          >
            <Glyph name="contact" size={13} className="text-tertiary shrink-0" />
            <span className="mono text-[13px] text-secondary w-20 shrink-0">{c.label}</span>
            {c.href && c.value ? (
              <>
                <ExternalLink href={c.href}>{c.value}</ExternalLink>
                {c.id === 'email' && <CopyButton value={c.value} />}
              </>
            ) : (
              <Empty>{c.pending}</Empty>
            )}
          </li>
        ))}
      </ul>

      <p className="mono text-[12px] text-tertiary mt-5 term-col">
        No contact form here yet. A form that silently fails is worse than no form,
        so this ships when there is an endpoint behind it that actually delivers.
      </p>
    </div>
  )
}
