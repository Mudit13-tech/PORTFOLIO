import {
  bin,
  channels,
  experiments,
  meta,
  profile,
  type Experiment,
} from '~/data'
import { counts, readingCeiling, readings, stability, system } from '@/lib/derived'
import { activityStats, channelList } from '@/lib/activity'
import { AppIcon3D, Chip, Empty, ExternalLink, Field, Glyph, Meter, type BrandName } from '@/components/ui'
import {
  AppHeader,
  AppPage,
  ArrowDot,
  Badge,
  Chapter,
  Dash,
  DotNumber,
  Inset,
  Orb,
  Pill,
  RoundLink,
  Stat,
} from '@/components/ui/kit'
import { ActivityTable, Heatmap } from '@/components/system/Heatmap'
import { RestoreAll } from '@/components/system/RestoreAll'
import { CopyButton } from '@/components/system/CopyButton'
import { ChannelTuner } from '@/components/system/ChannelTuner'

/* ------------------------------------------------------------ experiments */

export function ExperimentsApp() {
  const byCategory = experiments.reduce<Record<string, Experiment[]>>((acc, e) => {
    ;(acc[e.category] ??= []).push(e)
    return acc
  }, {})

  return (
    <AppPage>
      <AppHeader
        app="experiments"
        path="EXPERIMENTS/"
        title="Experiments"
        sub="Small builds made to answer one question each."
        aside={<Pill>{experiments.length} builds</Pill>}
      />

      <div className="grid gap-4">
        {Object.entries(byCategory).map(([category, items]) => (
          <section key={category}>
            <h2 className="field-label section-title mb-2">
              {category} · {items.length}
            </h2>
            <ul className="grid gap-2 @xl:grid-cols-2">
              {items.map((e) => (
                <li key={e.id}>
                  <a href={`/experiments/${e.id}`} className="tile flex items-center gap-3 px-3.5 py-3 h-full">
                    <Badge glyph="experiments" tone="warn" size={30} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] text-primary truncate">{e.name}</span>
                      <span className="block text-[12px] text-tertiary mt-0.5 truncate">{e.tested}</span>
                    </span>
                    <span className="text-tertiary">
                      <DotNumber value={e.year} size={11} />
                    </span>
                    <ArrowDot size={26} glyph="chevron" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </AppPage>
  )
}

export function ExperimentDetail({ experiment }: { experiment: Experiment }) {
  const todo = (s: string) => s.startsWith('TODO')
  return (
    <AppPage>
      <article>
        <Orb tone="warn" className="mb-6">
          <p className="field-label">Experiment · {experiment.category}</p>
          <h1 className="text-[26px] @lg:text-[30px] leading-[1.1] tracking-[-0.02em] font-medium text-primary mt-2">
            {experiment.name}
          </h1>
          <Inset className="mt-5 flex items-end gap-3">
            <Stat label="Tested">
              <span className="text-[13px] text-primary line-clamp-2">{experiment.tested}</span>
            </Stat>
            <Dash />
            <Stat label="Year" align="right">
              <DotNumber value={experiment.year} size={17} />
            </Stat>
          </Inset>
          {experiment.source && (
            <div className="mt-4">
              <RoundLink href={experiment.source}>Source</RoundLink>
            </div>
          )}
        </Orb>

        <Chapter n={1} id="why" title="Why" glyph="target" tone="info">
          <p className="lead">{experiment.why}</p>
        </Chapter>
        <Chapter n={2} id="result" title="Result" glyph="flag" tone="warn">
          {todo(experiment.result) ? (
            <Empty>{experiment.result.replace(/^TODO — /, '')}</Empty>
          ) : (
            <p className="prose-col">{experiment.result}</p>
          )}
        </Chapter>
        <Chapter n={3} id="learned" title="Learned" glyph="spark" tone="violet">
          {todo(experiment.learned) ? <Empty>not written up yet</Empty> : <p className="prose-col">{experiment.learned}</p>}
        </Chapter>
      </article>
    </AppPage>
  )
}

/* -------------------------------------------------------------------- bin */

export function BinApp() {
  return (
    <AppPage>
      <AppHeader
        app="bin"
        path="RECYCLE_BIN/"
        title="Recycle bin"
        sub="Emptying is disabled. Nothing here is really gone."
        aside={<RestoreAll />}
      />

      <ul className="grid gap-2">
        {bin.map((item) => (
          <li key={item.id} className="tile px-3.5 py-3">
            <div className="flex items-center gap-2.5">
              <Badge glyph={item.kind === 'folder' ? 'folder' : 'file'} tone="neutral" size={28} />
              <span className="mono text-[13px] text-primary truncate">{item.name}</span>
              <Pill className="ml-auto shrink-0">{item.meta}</Pill>
            </div>
            <p className="prose-col text-[14px] leading-[1.6] text-secondary mt-2">{item.story}</p>
          </li>
        ))}
      </ul>
    </AppPage>
  )
}

/* ---------------------------------------------------------------- monitor */

export function MonitorApp() {
  return (
    <AppPage>
      <AppHeader
        app="monitor"
        path="SYSTEM/MONITOR"
        title="System monitor"
        sub={`Activity ${activityStats.from} → ${activityStats.to}`}
        aside={
          <Pill tone="ok">
            <span className="w-1.5 h-1.5 rounded-full bg-ok" aria-hidden="true" />
            live
          </Pill>
        }
      />

      <ul className="grid grid-cols-2 @2xl:grid-cols-4 gap-2.5 mb-5">
        <StatOrb tone="ok" label="Stability" value={stability.display} note={`${counts.resolved} of ${counts.failures} resolved`} />
        <StatOrb
          tone="teal"
          label="Longest streak"
          value={String(activityStats.longest)}
          unit="days"
          note={`ended ${activityStats.endedOn ?? 'n/a'}`}
        />
        <StatOrb
          tone="info"
          label="Active days"
          value={String(activityStats.activeDays)}
          unit={`of ${activityStats.days}`}
          note="across both channels"
        />
        <StatOrb tone="violet" label="Uptime" text={system.uptime} note={`since ${meta.since}`} />
      </ul>

      <section className="grid gap-3">
        {channelList.map((c) => (
          <article key={c.id} className="tile p-4">
            <header className="flex flex-wrap items-end gap-x-3 gap-y-1 mb-3">
              <div>
                <h3 className="text-[13px] text-secondary">{c.label}</h3>
                <div className="flex items-end gap-1.5 mt-1.5" style={{ color: c.ramp[4] }}>
                  <DotNumber value={c.total} size={22} />
                  <span className="text-[12px] text-tertiary leading-none">{c.unit}</span>
                </div>
              </div>
              <span className="ml-auto micro text-tertiary">
                {c.activeDays} active days · longest run {c.longest}
              </span>
            </header>

            <Heatmap channel={c.id} />

            <p className="micro text-tertiary mt-2">{c.source}</p>
          </article>
        ))}
      </section>

      <ActivityTable />

      <p className="micro text-tertiary mt-3 term-col">
        One calendar per source, never one grid for both. The two are measured
        in different units, so adding them produces a number that means
        nothing — and each ramp steps from its own channel&apos;s quartiles,
        which is why the steps are printed beside it.
      </p>

      <Chapter n={1} id="readings" title="Readings" glyph="pulse" tone="teal" kicker={`${readings.length} sources`}>
        <ul className="grid gap-2 not-prose">
          {readings.map((r) => {
            const row = (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-[13px] text-primary flex-1 min-w-0 truncate">{r.label}</span>
                  <span className="mono text-[13px] text-ok tabular-nums shrink-0">{r.display}</span>
                </div>
                <div className="mt-2">
                  <Meter value={r.value} max={readingCeiling} />
                </div>
                <p className="micro text-tertiary mt-1.5">{r.source}</p>
              </>
            )
            return (
              <li key={r.id}>
                {r.href ? (
                  <a
                    href={r.href}
                    {...(r.href.startsWith('http') ? { target: '_blank', rel: 'noreferrer', 'data-native': 'true' } : {})}
                    className="tile block px-3.5 py-3"
                  >
                    {row}
                  </a>
                ) : (
                  <div className="tile px-3.5 py-3">{row}</div>
                )}
              </li>
            )
          })}
        </ul>
      </Chapter>

      <Chapter n={2} id="system" title="System" glyph="monitor" tone="info">
        <dl className="tile p-4 grid gap-2.5 not-prose">
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
      </Chapter>

      <p className="mono text-[12px] text-tertiary mt-4">
        Every number links to its source. Nothing here is typed into a component —
        the counts are the length of a data file, and the channel readings carry
        the date they were sampled.
      </p>
    </AppPage>
  )
}

/** One headline figure. Numbers go in dots; a phrase like an uptime stays text. */
function StatOrb({
  tone,
  label,
  value,
  unit,
  text,
  note,
}: {
  tone: 'ok' | 'teal' | 'info' | 'violet'
  label: string
  value?: string
  unit?: string
  text?: string
  note?: string
}) {
  return (
    <li>
      <Orb tone={tone} className="h-full p-3.5 rounded-[20px]">
        <p className="text-[12px] text-secondary">{label}</p>
        <div className="flex items-end gap-1.5 mt-3 min-h-[24px]">
          {value !== undefined ? (
            <>
              <DotNumber value={value} size={24} />
              {unit && <span className="text-[12px] text-secondary leading-none">{unit}</span>}
            </>
          ) : (
            <span className="text-[16px] leading-tight text-primary">{text}</span>
          )}
        </div>
        {note && <p className="micro text-tertiary mt-2 truncate">{note}</p>}
      </Orb>
    </li>
  )
}

/* ------------------------------------------------------------------ about */

export function AboutApp() {
  return (
    <AppPage>
      <Orb tone="violet" className="mb-6">
        <div className="flex items-start gap-3.5">
          <span className="shrink-0 mt-0.5">
            <AppIcon3D id="about" size={52} />
          </span>
          <div className="min-w-0">
            <p className="field-label">USER PROFILE</p>
            <h1 className="text-[28px] @lg:text-[32px] leading-[1.1] tracking-[-0.02em] font-medium text-primary mt-1.5">
              {profile.name}
            </h1>
            <p className="text-[14px] text-secondary mt-1">{profile.role}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {profile.status ? (
            <Pill>{profile.status}</Pill>
          ) : (
            <Pill tone="ok">
              <span className="w-1.5 h-1.5 rounded-full bg-ok" aria-hidden="true" />
              building
            </Pill>
          )}
          {profile.location ? <Pill>{profile.location}</Pill> : <Empty>location not published</Empty>}
        </div>

        <Inset className="mt-5 flex items-end gap-3">
          <Stat label="Discipline">
            <span className="text-[13px] text-primary line-clamp-2">{profile.discipline}</span>
          </Stat>
          <Dash />
          <Stat label="Institution" align="right">
            <span className="text-[13px] text-primary">{profile.institution}</span>
          </Stat>
        </Inset>

        <div className="flex flex-wrap gap-2 mt-4">
          <RoundLink href={profile.links.github}>GitHub</RoundLink>
          <RoundLink href={profile.links.leetcode}>LeetCode</RoundLink>
          {profile.links.resume ? (
            <RoundLink href={profile.links.resume}>Résumé</RoundLink>
          ) : (
            <Empty>Résumé not uploaded yet</Empty>
          )}
        </div>
      </Orb>

      <Chapter n={1} id="currently" title="Currently" glyph="clock" tone="ok" kicker={`as of ${profile.currently.asOf}`}>
        <ol className="timeline tone-ok not-prose">
          {profile.currently.items.map((c) => (
            <li key={c} className="text-[14px] leading-[1.6] text-primary">
              {c}
            </li>
          ))}
        </ol>
      </Chapter>

      <Chapter n={2} id="interests" title="Interests" glyph="spark" tone="violet">
        <div className="flex flex-wrap gap-1.5 not-prose">
          {profile.interests.map((i) => (
            <Chip key={i}>{i}</Chip>
          ))}
        </div>
      </Chapter>

      <Chapter n={3} id="process" title="Process" glyph="layers" tone="teal">
        <figure className="tile p-4 flex gap-3 not-prose">
          <Glyph name="quote" size={18} className="text-tertiary shrink-0 mt-0.5" />
          <blockquote className="text-[15px] leading-[1.65] text-primary">{profile.process}</blockquote>
        </figure>
      </Chapter>
    </AppPage>
  )
}

/* ---------------------------------------------------------------- contact */

const CHANNEL_BRAND: Record<string, BrandName | undefined> = {
  github: 'github',
  leetcode: 'leetcode',
  linkedin: 'linkedin',
}

export function ContactApp() {
  const reachable = channels.filter((c) => c.href)

  return (
    <AppPage>
      <Orb tone="info" className="mb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className="shrink-0 mt-0.5">
              <AppIcon3D id="contact" size={46} />
            </span>
            <div className="min-w-0">
              <p className="field-label">COMMUNICATION CHANNEL</p>
              <h1 className="text-[24px] @lg:text-[28px] leading-[1.15] tracking-[-0.02em] font-medium text-primary mt-1">
                Get in touch
              </h1>
            </div>
          </div>
          <Pill tone={reachable.length > 0 ? 'ok' : undefined}>
            <span className="live-dot" aria-hidden="true" />
            {reachable.length} of {channels.length} open
          </Pill>
        </div>

        <div className="mt-4">
          <ChannelTuner channels={channels} />
        </div>
      </Orb>

      <h2 className="field-label section-title mb-2">All channels</h2>
      <ul className="grid gap-2 @xl:grid-cols-2">
        {channels.map((c) => {
          const brand = CHANNEL_BRAND[c.id]
          return (
            <li key={c.id} className={`tile channel-row ${c.href ? '' : 'is-pending'}`}>
              {brand ? <Badge brand={brand} tone={brand} size={34} /> : <Badge glyph="contact" tone="mail" size={34} />}
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] text-secondary">{c.label}</span>
                {c.href && c.value ? (
                  <span className="flex items-center gap-2 min-w-0 mt-0.5">
                    <span className="min-w-0 truncate text-[14px]">
                      <ExternalLink href={c.href}>{c.value}</ExternalLink>
                    </span>
                    {c.id === 'email' && <CopyButton value={c.value} />}
                  </span>
                ) : (
                  <span className="block mono text-[12px] text-tertiary mt-0.5">{c.pending}</span>
                )}
              </span>
              {c.href ? (
                <span className="pill pill-ok shrink-0">
                  <Glyph name="signal" size={11} />
                  open
                </span>
              ) : (
                <span className="pill shrink-0 opacity-80">
                  <Glyph name="lock" size={11} />
                  pending
                </span>
              )}
            </li>
          )
        })}
      </ul>

      <div className="tile offline-note mt-5">
        <Badge glyph="lock" tone="neutral" size={30} />
        <div className="min-w-0">
          <p className="text-[13.5px] text-primary">Contact form · offline</p>
          <p className="mono text-[12px] text-tertiary mt-1 term-col">
            No form here yet. A form that silently fails is worse than no form, so this ships
            when there is an endpoint behind it that actually delivers.
          </p>
        </div>
      </div>
    </AppPage>
  )
}
