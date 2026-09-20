'use client'

import { useEffect } from 'react'
import { DOCK_H, TOP_BAR_H } from '@/os/constants'
import { LinkInterceptor } from '@/os/LinkInterceptor'
import { refFor } from '@/os/routes'
import { useShellKind, useSystem, useSystemApi } from '@/os/SystemProvider'
import { useShortcuts } from '@/os/useShortcuts'
import { WindowLayer } from '@/components/window/WindowLayer'
import { Overlays } from '@/components/system/Overlays'
import { Widgets } from '@/components/desktop/Widgets'
import { DesktopIcons } from './DesktopIcons'
import { Dock } from './Dock'
import { MenuBar } from './MenuBar'
import { MobileShell } from './MobileShell'

/**
 * The shell.
 *
 * Two chromes over one content layer. The desktop gets a menu bar, a desk with
 * widgets and icons, a dock and a window manager; the phone gets a home screen
 * and full-screen sheets. Both render the identical app components, because a
 * 390px screen pretending to be a draggable desktop is unusable and makes the
 * whole concept look ill-considered.
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
        <MenuBar />

        {kind === 'mobile' ? (
          <MobileShell />
        ) : (
          <>
            <main
              data-desk
              className="wallpaper fixed inset-0 overflow-hidden"
              style={{ paddingTop: TOP_BAR_H, paddingBottom: DOCK_H }}
            >
              <Widgets />
              <DesktopIcons />
              <WindowLayer />
            </main>
            <Dock />
          </>
        )}

        <Overlays />
      </div>
    </LinkInterceptor>
  )
}
