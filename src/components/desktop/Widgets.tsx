'use client'

import { profile } from '~/data'
import { activityStats, longDate } from '@/lib/activity'
import { counts, stability, system } from '@/lib/derived'
import { DOCK_H, TOP_BAR_H } from '@/os/constants'
import { APP_PATH } from '@/os/routes'
import { Glyph } from '@/components/ui'
import { Heatmap } from '@/components/system/Heatmap'

/**
 * Desk widgets.
 *
 * The three things a visitor should be able to read without opening anything:
 * whether this person is actually working, what they are working on, and
 * whether the system claiming to be an operating system is honest about its
 * own numbers.
 *
 * They are hidden below 1024px rather than reflowed. A widget squeezed into a
 * phone column is a worse version of the app it summarises, and the app is one
 * tap away.
 */
export function Widgets() {
  return (
    <div
      className="absolute left-4 hidden lg:flex flex-col gap-3 w-[336px] overflow-y-auto pr-1"
      style={{ top: TOP_BAR_H + 12, bottom: DOCK_H }}
    >
      <ActivityWidget />
      <NowWidget />
      <SystemWidget />
    </div>
  )
}

function Panel({
  title,
  hint,
  index,
  children,
}: {
  title: string
  hint?: string
  index: number
  children: React.ReactNode
}) {
  return (
    <section
      className="glass anim-widget rounded-2xl p-3.5 shrink-0"
      style={{ ['--i' as string]: index }}
    >
      <header className="flex items-baseline justify-between gap-2 mb-2.5">
        <h2 className="field-label">{title}</h2>
        {hint && <span className="micro text-tertiary truncate">{hint}</span>}
      </header>
      {children}
    </section>
  )
}

/* ---------------------------------------------------------------- activity
 * The heatmap, at a glance. Twenty-six weeks fit the widget honestly; the full
 * year is one click away in the system monitor, and the widget says so rather
 * than implying that half a year is the whole record.
 */
function ActivityWidget() {
  return (
    <Panel title="Activity" hint={`${activityStats.activeDays} active days`} index={0}>
      <div className="flex items-baseline gap-4 mb-2.5">
        <Stat value={activityStats.commits} label="contributions" tone="var(--hm-gh-4)" />
        <Stat value={activityStats.solved} label="solved" tone="var(--hm-lc-4)" />
      </div>

      <Heatmap weeks={26} cell={9} gap={2} full={false} />

      <footer className="flex items-center justify-between gap-2 mt-2.5 pt-2.5 border-t border-subtle/60">
        <span className="micro text-tertiary">
          longest streak {activityStats.longest} days
        </span>
        <a
          href={APP_PATH.monitor}
          className="micro text-ok hover:text-primary inline-flex items-center gap-1"
        >
          full year
          <Glyph name="chevron" size={10} />
        </a>
      </footer>
    </Panel>
  )
}

function Stat({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-[22px] leading-none tabular-nums" style={{ color: tone }}>
        {value}
      </span>
      <span className="micro text-tertiary">{label}</span>
    </span>
  )
}

/* -------------------------------------------------------------------- now */

function NowWidget() {
  return (
    <Panel title="Currently" hint={`as of ${profile.currently.asOf}`} index={1}>
      <ul className="grid gap-1.5">
        {profile.currently.items.map((item) => (
          <li key={item} className="flex gap-2 text-[13px] leading-[1.45] text-secondary">
            <span className="mono text-ok shrink-0" aria-hidden="true">
              →
            </span>
            {item}
          </li>
        ))}
      </ul>
    </Panel>
  )
}

/* ----------------------------------------------------------------- system
 * Four readings, each of which can be checked. Stability is not asserted, it
 * is defined — resolved crash reports over total — and the widget shows the
 * division rather than only its result.
 */
function SystemWidget() {
  return (
    <Panel title="System" hint={`build ${system.build}`} index={2}>
      <dl className="grid gap-1.5">
        <Reading label="uptime" value={system.uptime} />
        <Reading
          label="stability"
          value={stability.display}
          note={`${counts.resolved} of ${counts.failures} resolved`}
          tone="text-ok"
        />
        <Reading label="busiest day" value={longDate(activityStats.busiest.date)} />
      </dl>
    </Panel>
  )
}

function Reading({
  label,
  value,
  note,
  tone = 'text-primary',
}: {
  label: string
  value: string
  note?: string
  tone?: string
}) {
  return (
    <div className="flex items-baseline gap-3">
      <dt className="micro text-tertiary w-20 shrink-0">{label}</dt>
      <dd className={`mono text-[12px] ${tone} truncate`}>
        {value}
        {note && <span className="text-tertiary"> · {note}</span>}
      </dd>
    </div>
  )
}
