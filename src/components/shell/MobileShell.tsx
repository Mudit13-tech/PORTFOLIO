'use client'

import { useEffect, useSyncExternalStore } from 'react'
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
 *
 * The viewport is `cover`, so every edge here is padded by its safe-area
 * inset: nothing sits under the notch, the home indicator or a rounded corner,
 * in portrait or on its side. The sheet stops below the menu bar, because the
 * Résumé and GitHub links in it are the one thing no overlay may cover.
 */
const DOCK_APPS = ['projects', 'failures', 'terminal', 'contact'] as const

/** The home column never grows past this, so a tablet does not get a 1-inch-per-icon grid. */
const COLUMN = 560

function useViewportWidth(): number {
  return useSyncExternalStore(
    (fn) => {
      window.addEventListener('resize', fn)
      return () => window.removeEventListener('resize', fn)
    },
    () => window.innerWidth,
    () => 390,
  )
}

export function MobileShell() {
  const windows = useSystem((s) => s.windows)
  const api = useSystemApi()
  const top = windows.at(-1) ?? null
  const vw = useViewportWidth()

  // iOS lays the keyboard over the page rather than resizing it, which would
  // bury the terminal's command line. The visual viewport knows how much is
  // covered; the sheet stands on top of that instead of on the screen edge.
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const root = document.documentElement
    const sync = () => {
      const covered = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      root.style.setProperty('--kb', `${Math.round(covered)}px`)
    }
    sync()
    vv.addEventListener('resize', sync)
    vv.addEventListener('scroll', sync)
    return () => {
      vv.removeEventListener('resize', sync)
      vv.removeEventListener('scroll', sync)
      root.style.removeProperty('--kb')
    }
  }, [])

  // As many weeks as fit the card without a scrollbar: column width, less the
  // page and card padding, over one cell and its gap.
  const weeks = Math.max(12, Math.min(26, Math.floor((Math.min(vw, COLUMN) - 32 - 32 + 3) / 14)))

  return (
    <>
      <main
        data-desk
        className="wallpaper fixed inset-0 overflow-y-auto overscroll-contain"
        style={{
          paddingTop: `calc(${TOP_BAR_H + 14}px + var(--sat))`,
          paddingBottom: 'calc(112px + var(--sab))',
          paddingLeft: 'var(--sal)',
          paddingRight: 'var(--sar)',
        }}
      >
        <div className="mx-auto w-full px-4" style={{ maxWidth: COLUMN }}>
          <ul className="grid grid-cols-4 min-[460px]:grid-cols-5 gap-y-4 pt-1" aria-label="Applications">
            {APP_ORDER.map((id, i) => (
              <li key={id} className="anim-icon flex justify-center min-w-0" style={{ ['--i' as string]: i }}>
                <a
                  href={APP_PATH[id]}
                  className="desk-icon flex flex-col items-center gap-1.5 w-full max-w-[84px] min-h-[44px] pt-1 pb-1.5 rounded-xl"
                >
                  <AppIcon3D id={id} size={54} />
                  <span className="desk-label max-w-full truncate text-[11.5px] font-medium leading-tight text-center text-primary">
                    {APP_LABEL[id]}
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <section className="glass mt-7 rounded-3xl p-4">
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
                  <Heatmap channel={c.id} weeks={weeks} cell={11} gap={3} full={false} />
                </div>
              ))}
            </div>
          </section>

          <p className="mono text-[12px] text-tertiary text-center px-6 mt-5 desk-label">
            {profile.name} · {profile.institution}
          </p>
        </div>
      </main>

      {/* The phone dock: four applications, always reachable with a thumb. */}
      <nav
        aria-label="Dock"
        className="glass fixed z-[500] mx-auto flex justify-around items-center rounded-[26px] py-2"
        style={{
          bottom: 'calc(12px + var(--sab))',
          left: 'calc(12px + var(--sal))',
          right: 'calc(12px + var(--sar))',
          maxWidth: COLUMN - 24,
        }}
      >
        {DOCK_APPS.map((id) => (
          <a
            key={id}
            href={APP_PATH[id]}
            aria-label={APP_TITLE[id]}
            className="grid place-items-center min-w-[44px] min-h-[44px] rounded-xl"
          >
            <AppIcon3D id={id} size={46} />
          </a>
        ))}
      </nav>

      {top && (
        <div
          className="sheet fixed inset-x-0 z-[600] anim-sheet flex flex-col"
          style={{ top: `calc(${TOP_BAR_H}px + var(--sat))`, bottom: 'var(--kb, 0px)' }}
          role="dialog"
          aria-label={APP_TITLE[top.id]}
        >
          <header
            className="grid grid-cols-[1fr_auto_1fr] items-center h-12 shrink-0 border-b border-subtle/70"
            style={{ paddingLeft: 'calc(8px + var(--sal))', paddingRight: 'calc(12px + var(--sar))' }}
          >
            <button
              type="button"
              onClick={() => api.close(top.id)}
              className="justify-self-start flex items-center gap-1.5 text-[14px] text-primary min-h-[44px] pr-3"
            >
              <span className="arrow-dot w-8 h-8 rotate-180">
                <Glyph name="chevron" size={13} />
              </span>
              Back
            </button>
            <span className="mono text-[12px] text-primary truncate">{APP_TITLE[top.id]}</span>
            <span className="justify-self-end">
              {countFor(top.id) !== null && <span className="pill">{countFor(top.id)}</span>}
            </span>
          </header>
          <div
            className="sheet-body @container flex-1 overflow-auto overscroll-contain"
            style={{ paddingLeft: 'var(--sal)', paddingRight: 'var(--sar)' }}
          >
            <AppView id={top.id} payload={top.payload} />
          </div>
        </div>
      )}
    </>
  )
}
