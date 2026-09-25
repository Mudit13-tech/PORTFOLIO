'use client'

import { profile } from '~/data'
import { activityStats, channelList } from '@/lib/activity'
import { countFor } from '@/lib/derived'
import { TOP_BAR_H } from '@/os/constants'
import { APP_LABEL, APP_ORDER, APP_PATH, APP_TITLE } from '@/os/routes'
import { useSystem, useSystemApi } from '@/os/SystemProvider'
import { AppIcon3D, Glyph } from '@/components/ui'
import { Heatmap } from '@/components/system/Heatmap'
import { AppView } from '@/components/window/registry'

/**
 * MUDIT OS Mobile.
 *
 * A home screen, not a shrunken desktop: tap an icon, the application arrives
 * as a full-screen sheet, Back dismisses it. Every target clears 44px and the
 * icons are the same real links the desktop uses, so nothing about the
 * content, the routing or the crawler's view changes with the viewport.
 */
const DOCK_APPS = ['projects', 'failures', 'terminal', 'contact'] as const

export function MobileShell() {
  const windows = useSystem((s) => s.windows)
  const api = useSystemApi()
  const top = windows.at(-1) ?? null

  return (
    <>
      <main
        data-desk
        className="wallpaper fixed inset-0 overflow-y-auto"
        style={{ paddingTop: TOP_BAR_H + 8, paddingBottom: 104 }}
      >
        <ul className="grid grid-cols-4 gap-y-4 px-4 pt-2" aria-label="Applications">
          {APP_ORDER.map((id, i) => (
            <li key={id} className="anim-icon flex justify-center" style={{ ['--i' as string]: i }}>
              <a
                href={APP_PATH[id]}
                className="desk-icon flex flex-col items-center gap-1.5 w-[78px] min-h-[44px] pt-1 pb-1.5 rounded-xl"
              >
                <AppIcon3D id={id} size={54} />
                <span className="desk-label text-[11.5px] font-medium leading-tight text-center text-primary whitespace-nowrap">
                  {APP_LABEL[id]}
                </span>
              </a>
            </li>
          ))}
        </ul>

        <section className="glass mx-4 mt-6 rounded-2xl p-3.5">
          <header className="flex items-baseline justify-between mb-3">
            <h2 className="field-label">Activity</h2>
            <span className="micro text-tertiary">{activityStats.activeDays} active days</span>
          </header>
          <div className="grid gap-4">
            {channelList.map((c) => (
              <div key={c.id}>
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="text-[18px] leading-none tabular-nums" style={{ color: c.ramp[4] }}>
                    {c.total}
                  </span>
                  <span className="micro text-tertiary">{c.unit}</span>
                  <span className="ml-auto mono text-[11px] text-secondary">{c.label}</span>
                </div>
                <Heatmap channel={c.id} weeks={22} cell={11} gap={3} full={false} />
              </div>
            ))}
          </div>
        </section>

        <p className="mono text-[12px] text-tertiary text-center px-6 mt-5 desk-label">
          {profile.name} · {profile.institution}
        </p>
      </main>

      {/* The phone dock: four applications, always reachable with a thumb. */}
      <nav
        aria-label="Dock"
        className="glass fixed bottom-3 inset-x-3 z-[500] flex justify-around items-center rounded-[22px] py-2"
      >
        {DOCK_APPS.map((id) => (
          <a
            key={id}
            href={APP_PATH[id]}
            aria-label={APP_TITLE[id]}
            className="grid place-items-center min-w-[44px] min-h-[44px] rounded-xl"
          >
            <AppIcon3D id={id} size={44} />
          </a>
        ))}
      </nav>

      {top && (
        <div
          className="fixed inset-0 z-[600] bg-window anim-sheet flex flex-col"
          role="dialog"
          aria-label={APP_TITLE[top.id]}
        >
          <header className="glass flex items-center gap-2 px-2 h-12 shrink-0 rounded-none border-x-0 border-t-0">
            <button
              type="button"
              onClick={() => api.close(top.id)}
              className="flex items-center gap-1.5 mono text-[13px] text-secondary min-h-[44px] px-2"
            >
              <span className="rotate-180">
                <Glyph name="chevron" size={14} />
              </span>
              Back
            </button>
            <span className="mono text-[12px] text-primary mx-auto pr-12 truncate">
              {APP_TITLE[top.id]}
            </span>
            <span className="micro text-tertiary absolute right-3">{countFor(top.id) ?? ''}</span>
          </header>
          <div className="flex-1 overflow-auto">
            <AppView id={top.id} payload={top.payload} />
          </div>
        </div>
      )}
    </>
  )
}
