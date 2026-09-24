'use client'

import { useEffect, useRef, useState } from 'react'
import { DOCK_H } from '@/os/constants'
import { APP_LABEL, APP_ORDER, APP_PATH, APP_SUBTITLE, APP_TITLE } from '@/os/routes'
import { markOrigin } from '@/os/motion'
import { useSystem, useSystemApi } from '@/os/SystemProvider'
import type { AppId } from '@/os/types'
import { AppIcon } from '@/components/ui'

/** Resting icon size, the size under the cursor, and how far the swell reaches. */
const BASE = 50
const PEAK = 74
const REACH = 150

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
  const magnify = useMagnify()

  const apps = APP_ORDER.filter((id) => id !== 'bin')

  const item = (id: AppId) => (
    <DockItem
      key={id}
      id={id}
      open={windows.some((w) => w.id === id)}
      minimized={windows.some((w) => w.id === id && w.minimized)}
      focused={focused === id}
      shaking={evicted === id}
      api={api}
    />
  )

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-[500] flex justify-center items-end pb-3 pointer-events-none"
      style={{ height: DOCK_H }}
    >
      <nav
        aria-label="Dock"
        {...magnify}
        className="glass pointer-events-auto flex items-end gap-2 px-2.5 pt-2 pb-[11px] rounded-[22px]"
      >
        {apps.map(item)}
        <span className="w-px self-stretch bg-strong/70 mx-[3px] my-1" aria-hidden="true" />
        {item('bin')}
      </nav>
    </div>
  )
}

/**
 * The magnifier. Icons swell as the pointer passes, with a smoothstep falloff
 * so the row reads as one surface rather than a single icon popping.
 *
 * Like the window drag, it writes sizes straight to the slots and React never
 * sees the frames. Slot centres are measured once, at rest, on entry: measured
 * again mid-swell they would drift under the cursor and the dock would chase
 * itself. Off for touch, where there is no hover, and under reduced motion.
 */
function useMagnify() {
  const centres = useRef<{ el: HTMLElement; x: number }[] | null>(null)
  const frame = useRef(0)

  const size = (el: HTMLElement, px: number) => {
    el.style.width = `${px}px`
    el.style.height = `${px}px`
  }

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!centres.current) {
      centres.current = [...e.currentTarget.querySelectorAll<HTMLElement>('.dock-slot')].map((el) => {
        const r = el.getBoundingClientRect()
        return { el, x: r.left + r.width / 2 }
      })
    }
    const mx = e.clientX
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      for (const { el, x } of centres.current ?? []) {
        let t = Math.max(0, 1 - Math.abs(mx - x) / REACH)
        t = t * t * (3 - 2 * t)
        size(el, Math.round(BASE + (PEAK - BASE) * t))
      }
    })
  }

  const onPointerLeave = () => {
    cancelAnimationFrame(frame.current)
    for (const { el } of centres.current ?? []) size(el, BASE)
    centres.current = null
  }

  return { onPointerMove, onPointerLeave }
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
    const t = setTimeout(() => setBounce(false), 820)
    return () => clearTimeout(t)
  }, [open])

  return (
    <span className="dock-slot relative block" style={{ width: BASE, height: BASE }}>
      <button
        type="button"
        data-dock={id}
        aria-label={`${APP_TITLE[id]} — ${APP_SUBTITLE[id]}${open ? ', open' : ''}`}
        aria-pressed={open && !minimized}
        onPointerDown={(e) => markOrigin(id, e.currentTarget)}
        onClick={() => {
          if (focused && open && !minimized) return api.minimize(id)
          api.open(id)
          window.history.pushState(null, '', APP_PATH[id])
        }}
        className={`dock-item block w-full h-full p-0 rounded-[14px] ${bounce ? 'anim-bounce' : ''} ${
          shaking ? 'anim-shake' : ''
        }`}
      >
        <AppIcon id={id} size={BASE} fluid />
      </button>

      <span
        aria-hidden="true"
        className="running-dot absolute left-1/2 -bottom-2 -ml-0.5 h-1 w-1 rounded-full"
        style={{ opacity: open ? 1 : 0 }}
      />

      {/* Decorative: the button's own aria-label already carries this text,
          and announcing it twice helps nobody. */}
      <span
        aria-hidden="true"
        className="tooltip absolute bottom-[calc(100%+12px)] left-1/2 whitespace-nowrap rounded-md px-[9px] py-1 text-[11.5px]"
      >
        {APP_LABEL[id]}
      </span>
    </span>
  )
}
