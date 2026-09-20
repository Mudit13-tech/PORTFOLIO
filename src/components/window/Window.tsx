'use client'

import { useCallback, useRef } from 'react'
import { CHROME_H } from '@/os/constants'
import { useDragHandle, useResizeHandle } from '@/os/useDrag'
import { useSystemApi } from '@/os/SystemProvider'
import { APP_TITLE } from '@/os/routes'
import type { SnapSide, WindowState } from '@/os/types'
import { Glyph } from '@/components/ui'

/**
 * One window.
 *
 * Positioned entirely by `transform`, never by `top`/`left`, so a drag costs a
 * composite rather than a layout. `contain: layout style paint` keeps a repaint
 * inside one window from costing the others.
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

  if (win.minimized) return null

  const titleId = `win-title-${win.id}`

  return (
    <section
      ref={ref}
      data-window={win.id}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      className={`window anim-open absolute top-0 left-0 flex flex-col rounded-md border overflow-hidden ${
        focused ? 'border-focus/60 shadow-[var(--shadow-focus)]' : 'border-subtle shadow-[var(--shadow-rest)]'
      } bg-window`}
      style={{
        transform: `translate3d(${win.rect.x}px, ${win.rect.y}px, 0)`,
        width: win.rect.w,
        height: win.rect.h,
        zIndex: win.z,
        // Read by the open animation so it starts from the window's own position.
        ['--wx' as string]: `${win.rect.x}px`,
        ['--wy' as string]: `${win.rect.y}px`,
      }}
      onPointerDown={focus}
    >
      <header
        onPointerDown={onDragStart}
        onDoubleClick={() => api.toggleMaximize(win.id)}
        className={`flex items-center gap-2 px-3 shrink-0 border-b border-subtle bg-chrome select-none ${
          win.maximized ? '' : 'cursor-grab'
        } ${focused ? '' : 'opacity-60'}`}
        style={{ height: CHROME_H }}
      >
        <Glyph name={win.id} size={13} className="text-tertiary shrink-0" />
        <h2 id={titleId} className="mono text-[12px] text-secondary truncate">
          {APP_TITLE[win.id]}
          {win.payload ? `/${win.payload}` : ''}
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
      className={`grid place-items-center w-6 h-6 rounded-sm text-tertiary hover:bg-raised ${
        danger ? 'hover:text-error' : 'hover:text-primary'
      }`}
    >
      {children}
    </button>
  )
}
