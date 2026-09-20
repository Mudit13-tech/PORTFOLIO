'use client'

import { useEffect } from 'react'
import { DOCK_H, TOP_BAR_H } from '@/os/constants'
import { LinkInterceptor } from '@/os/LinkInterceptor'
import { APP_ORDER, APP_PATH, APP_SUBTITLE, APP_TITLE, refFor } from '@/os/routes'
import { useShellKind, useSystem, useSystemApi } from '@/os/SystemProvider'
import { useShortcuts } from '@/os/useShortcuts'
import { countFor } from '@/lib/derived'
import { Glyph } from '@/components/ui'
import { WindowLayer } from '@/components/window/WindowLayer'
import { AppView } from '@/components/window/registry'
import { Dock, IconGrid, TopBar } from './chrome'
import { Overlays } from '@/components/system/Overlays'

/**
 * The shell.
 *
 * Three chromes over one content layer. The desktop gets a window manager, the
 * tablet a single maximised window, the phone a stack of sheets — and all three
 * render the identical app components, because a 390px screen pretending to be
 * a draggable desktop is unusable and makes the whole concept look
 * ill-considered.
 */
export function Shell({
  entry,
  serverContent,
}: {
  /** The route this page was served from, so a deep link opens its window. */
  entry: string
  serverContent: React.ReactNode
}) {
  const kind = useShellKind()
  const api = useSystemApi()
  const booted = useSystem((s) => s.booted)

  useShortcuts(booted)

  // A deep link opens straight into its window, with boot skipped. The window
  // shows the server-rendered HTML this page already delivered.
  useEffect(() => {
    const ref = refFor(entry)
    if (ref) {
      api.setBooted(true)
      api.open(ref.id, ref.payload)
    }
  }, [api, entry])

  // Back and forward move between windows rather than reloading the system.
  useEffect(() => {
    const onPop = () => {
      const ref = refFor(window.location.pathname)
      if (ref) api.open(ref.id, ref.payload)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [api])

  return (
    <LinkInterceptor>
      {/*
        The document underneath. It is always in the server-rendered HTML, which
        is what a crawler indexes and what a visitor without JavaScript reads.
        The CSS removes it the moment scripting is confirmed, before first paint.
      */}
      <div className="static-doc" id="content">
        {serverContent}
      </div>

      <div className="os-shell">
        <TopBar />

        {kind === 'mobile' ? (
          <MobileShell />
        ) : (
          <main
            className="wallpaper fixed inset-0 overflow-hidden"
            style={{ paddingTop: TOP_BAR_H, paddingBottom: DOCK_H }}
          >
            <IconGrid />
            <WindowLayer />
          </main>
        )}

        {kind !== 'mobile' && <Dock />}
        <Overlays />
      </div>
    </LinkInterceptor>
  )
}

/**
 * MUDIT OS Mobile — the same system, a different shell, the same data.
 * One app at a time, as a full-screen sheet.
 */
function MobileShell() {
  const windows = useSystem((s) => s.windows)
  const api = useSystemApi()
  const top = windows.at(-1) ?? null

  return (
    <main className="wallpaper fixed inset-0 overflow-auto" style={{ paddingTop: TOP_BAR_H }}>
      <ul className="p-3">
        {APP_ORDER.map((id) => (
          <li key={id}>
            <a
              href={APP_PATH[id]}
              className="flex items-center gap-3 py-3 px-2 border-b border-subtle/60 min-h-[44px]"
            >
              <Glyph name={id} className="text-secondary shrink-0" />
              <span className="mono text-[14px] text-primary">{APP_TITLE[id]}</span>
              <span className="ml-auto flex items-center gap-2 shrink-0">
                <span className="micro text-tertiary">{countFor(id) ?? APP_SUBTITLE[id]}</span>
                <Glyph name="chevron" size={12} className="text-tertiary" />
              </span>
            </a>
          </li>
        ))}
      </ul>

      {top && (
        <div className="fixed inset-0 z-[600] bg-window anim-sheet flex flex-col" role="dialog" aria-label={APP_TITLE[top.id]}>
          <header className="flex items-center gap-2 px-3 h-11 border-b border-subtle bg-chrome shrink-0">
            <button
              type="button"
              onClick={() => api.close(top.id)}
              className="flex items-center gap-1.5 mono text-[13px] text-secondary min-h-[44px] px-1"
            >
              <span className="rotate-180">
                <Glyph name="chevron" size={14} />
              </span>
              Back
            </button>
            <span className="mono text-[12px] text-tertiary ml-auto">{APP_TITLE[top.id]}</span>
          </header>
          <div className="flex-1 overflow-auto">
            <AppView id={top.id} payload={top.payload} />
          </div>
        </div>
      )}
    </main>
  )
}
