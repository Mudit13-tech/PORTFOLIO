'use client'

import { useEffect, useRef, useState } from 'react'
import { countFor } from '@/lib/derived'
import { DOCK_H } from '@/os/constants'
import { APP_LABEL, APP_ORDER, APP_PATH, APP_SUBTITLE, APP_TITLE } from '@/os/routes'
import { useSystem, useSystemApi } from '@/os/SystemProvider'
import type { AppId } from '@/os/types'
import { AppIcon } from '@/components/ui'

/**
 * The dock.
 *
 * Buttons rather than links, deliberately: a dock icon is a three-state
 * control — open it, focus it, minimize it — and that is not what an anchor
 * means. Every one of these applications is reachable as a real URL from the
 * desktop icons and from the document underneath, so nothing is lost to a
 * crawler or to a visitor without JavaScript by making the dock chrome.
 */
export function Dock() {
  const windows = useSystem((s) => s.windows)
  const focused = useSystem((s) => s.focusOrder.at(-1) ?? null)
  const evicted = useSystem((s) => s.evicted)
  const api = useSystemApi()

  const apps = APP_ORDER.filter((id) => id !== 'bin')

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-[500] flex justify-center items-end pb-2.5 pointer-events-none"
      style={{ height: DOCK_H }}
    >
      <nav
        aria-label="Dock"
        className="glass pointer-events-auto flex items-end gap-0.5 px-2 py-1.5 rounded-[18px] max-w-[calc(100vw-1.5rem)] overflow-x-auto"
      >
        {apps.map((id) => (
          <DockItem
            key={id}
            id={id}
            open={windows.some((w) => w.id === id)}
            minimized={windows.some((w) => w.id === id && w.minimized)}
            focused={focused === id}
            shaking={evicted === id}
            api={api}
          />
        ))}

        <span className="w-px self-stretch bg-strong/70 mx-1.5 my-1.5" aria-hidden="true" />

        <DockItem
          id="bin"
          open={windows.some((w) => w.id === 'bin')}
          minimized={windows.some((w) => w.id === 'bin' && w.minimized)}
          focused={focused === 'bin'}
          shaking={evicted === 'bin'}
          api={api}
        />
      </nav>
    </div>
  )
}

function DockItem({
  id,
  open,
  minimized,
  focused,
  shaking,
  api,
}: {
  id: AppId
  open: boolean
  minimized: boolean
  focused: boolean
  shaking: boolean
  api: ReturnType<typeof useSystemApi>
}) {
  // The icon hops once when its window is created, and never again — the point
  // is to show you where the window came from, not to ask for attention.
  const [bounce, setBounce] = useState(false)
  const was = useRef(open)
  useEffect(() => {
    const justOpened = open && !was.current
    was.current = open
    if (!justOpened) return
    setBounce(true)
    const t = setTimeout(() => setBounce(false), 460)
    return () => clearTimeout(t)
  }, [open])

  const count = countFor(id)

  return (
    <span className="dock-slot relative flex flex-col items-center">
      <button
        type="button"
        aria-label={`${APP_TITLE[id]} — ${APP_SUBTITLE[id]}${open ? ', open' : ''}`}
        aria-pressed={open && !minimized}
        onClick={() => {
          if (focused && open && !minimized) return api.minimize(id)
          api.open(id)
          window.history.pushState(null, '', APP_PATH[id])
        }}
        className={`dock-item block p-0.5 rounded-[14px] ${bounce ? 'anim-bounce' : ''} ${
          shaking ? 'anim-shake' : ''
        }`}
      >
        <AppIcon id={id} size={40} className={minimized ? 'opacity-55' : ''} />
      </button>

      <span
        aria-hidden="true"
        className={`running-dot mt-1 h-[3px] w-[3px] rounded-full ${open ? '' : 'opacity-0'}`}
      />

      {/* Decorative: the button's own aria-label already carries this text,
          and announcing it twice helps nobody. */}
      <span
        aria-hidden="true"
        className="tooltip glass absolute bottom-[calc(100%+6px)] left-1/2 whitespace-nowrap rounded-md px-2 py-1 mono text-[11px] text-primary"
      >
        {APP_LABEL[id]}
        {count !== null && <span className="text-tertiary"> · {count}</span>}
      </span>
    </span>
  )
}
