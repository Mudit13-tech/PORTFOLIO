'use client'

import { useCallback, useLayoutEffect, useRef } from 'react'
import { CHROME_H } from '@/os/constants'
import { useDragHandle, useResizeHandle } from '@/os/useDrag'
import { useSystemApi } from '@/os/SystemProvider'
import { playOpen, registerWindow } from '@/os/motion'
import { APP_TITLE } from '@/os/routes'
import type { SnapSide, WindowState } from '@/os/types'
import { AppIcon, Glyph } from '@/components/ui'

/**
 * One window.
 *
 * Positioned entirely by `transform`, never by `top`/`left`, so a drag costs a
 * composite rather than a layout. `contain: layout style paint` keeps a repaint
 * inside one window from costing the others.
 *
 * It grows out of the icon that opened it, and the store plays it back into
 * the dock on close and minimize — see `os/motion`.
 */
export function Window({
  win,
  focused,
  onSnapPreview,
  children,
}: {
  win: WindowState
  focused: boolean
  onSnapPreview: (side: SnapSide) => void
  children: React.ReactNode
}) {
  const api = useSystemApi()
  const ref = useRef<HTMLElement>(null)
  const rect = useRef(win.rect)
  rect.current = win.rect

  const getRect = useCallback(() => rect.current, [])
  const focus = useCallback(() => api.focus(win.id), [api, win.id])

  const onDragStart = useDragHandle({
    id: win.id,
    getRect,
    onCommit: (x, y) => api.move(win.id, x, y),
    onSnap: (side) => api.snap(win.id, side),
    onSnapPreview,
    onFocus: focus,
    disabled: win.maximized,
  })

  const onResizeStart = useResizeHandle({
    getRect,
    onCommit: (r) => api.resize(win.id, r),
    onFocus: focus,
    disabled: win.maximized,
  })

  // Runs each time the window appears: on first open, and on every restore
  // from the dock, which is when it should grow back out of its dock icon.
  const shown = useRef(false)
  useLayoutEffect(() => {
    const el = ref.current
    if (win.minimized || !el) return
    playOpen(win.id, el, shown.current)
    shown.current = true
    return registerWindow(win.id, el)
  }, [win.id, win.minimized])

  if (win.minimized) return null

  const titleId = `win-title-${win.id}`

  return (
    <section
      ref={ref}
      data-window={win.id}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      className={`window absolute top-0 left-0 flex flex-col rounded-xl border overflow-hidden bg-window ${
        focused
          ? 'border-strong shadow-[var(--shadow-focus)]'
          : 'border-subtle shadow-[var(--shadow-rest)]'
      }`}
      style={{
        transform: `translate3d(${win.rect.x}px, ${win.rect.y}px, 0)`,
        width: win.rect.w,
        height: win.rect.h,
        zIndex: win.z,
      }}
      onPointerDown={focus}
    >
      <header
        onPointerDown={onDragStart}
        onDoubleClick={() => api.toggleMaximize(win.id)}
        className={`window-chrome flex items-center gap-2 px-2.5 shrink-0 border-b border-subtle select-none ${
          win.maximized ? '' : 'cursor-grab'
        } ${focused ? '' : 'opacity-70'}`}
        style={{ height: CHROME_H }}
      >
        <AppIcon id={win.id} size={18} />
        <h2 id={titleId} className="mono text-[12px] truncate">
          <span className={focused ? 'text-primary' : 'text-secondary'}>{APP_TITLE[win.id]}</span>
          {win.payload ? <span className="text-tertiary">/{win.payload}</span> : null}
        </h2>

        <div className="ml-auto flex items-center gap-0.5 shrink-0">
          <ChromeButton label="Minimize" onClick={() => api.minimize(win.id)}>
            <Glyph name="minimize" size={13} />
          </ChromeButton>
          <ChromeButton label={win.maximized ? 'Restore' : 'Maximize'} onClick={() => api.toggleMaximize(win.id)}>
            <Glyph name="maximize" size={11} />
          </ChromeButton>
          <ChromeButton label="Close" onClick={() => api.close(win.id)} danger>
            <Glyph name="close" size={13} />
          </ChromeButton>
        </div>
      </header>

      <div className="flex-1 overflow-auto overscroll-contain">{children}</div>

      {!win.maximized && (
        <>
          <span
            onPointerDown={onResizeStart('e')}
            className="absolute top-8 right-0 bottom-3 w-1.5 cursor-ew-resize"
            aria-hidden="true"
          />
          <span
            onPointerDown={onResizeStart('s')}
            className="absolute bottom-0 left-3 right-3 h-1.5 cursor-ns-resize"
            aria-hidden="true"
          />
          <span
            onPointerDown={onResizeStart('se')}
            className="absolute bottom-0 right-0 w-3.5 h-3.5 cursor-nwse-resize"
            aria-hidden="true"
          />
        </>
      )}
    </section>
  )
}

function ChromeButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string
  onClick: () => void
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`grid place-items-center w-[22px] h-[22px] rounded-md border border-transparent text-tertiary hover:border-subtle hover:bg-raised ${
        danger ? 'hover:text-error hover:border-error/50 hover:bg-error/12' : 'hover:text-primary'
      }`}
    >
      {children}
    </button>
  )
}
