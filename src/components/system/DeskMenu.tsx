'use client'

import { useCallback, useEffect, useState } from 'react'
import { APP_PATH } from '@/os/routes'
import { useSystem, useSystemApi } from '@/os/SystemProvider'
import { useTheme } from '@/os/theme'
import type { AppId } from '@/os/types'
import { Glyph } from '@/components/ui'

const W = 232

/**
 * Right-click on the desk.
 *
 * Only on the desk: a right-click inside a window, on a link, or on any
 * control gets the browser's own menu, because overriding "open in new tab"
 * on a page full of real links would be taking something away to show off.
 */
export function DeskMenu() {
  const api = useSystemApi()
  const windows = useSystem((s) => s.windows)
  const { theme, toggle } = useTheme()
  const [at, setAt] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const onMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-desk]')) return
      if (target.closest('[data-window], a, button, input, textarea')) return
      e.preventDefault()
      setAt({
        x: Math.min(e.clientX, window.innerWidth - W - 8),
        y: Math.min(e.clientY, window.innerHeight - 260),
      })
    }
    const dismiss = () => setAt(null)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setAt(null)

    document.addEventListener('contextmenu', onMenu)
    document.addEventListener('pointerdown', dismiss)
    window.addEventListener('blur', dismiss)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('contextmenu', onMenu)
      document.removeEventListener('pointerdown', dismiss)
      window.removeEventListener('blur', dismiss)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const open = useCallback(
    (id: AppId) => () => {
      api.open(id)
      window.history.pushState(null, '', APP_PATH[id])
    },
    [api],
  )

  if (!at) return null

  return (
    <div
      role="dialog"
      aria-label="Desk actions"
      className="menu-panel glass fixed z-[880] rounded-lg p-1"
      style={{ left: at.x, top: at.y, width: W }}
      onClick={() => setAt(null)}
    >
      <Row onSelect={open('terminal')} hint="⌃T">
        <Glyph name="terminal" size={13} className="text-tertiary" />
        Open terminal
      </Row>
      <Row onSelect={() => api.setOverlay('launcher')} hint="⌃K">
        <Glyph name="search" size={13} className="text-tertiary" />
        Search everything
      </Row>
      <Row onSelect={toggle}>
        <Glyph name="theme" size={13} className="text-tertiary" />
        {theme === 'light' ? 'Dark appearance' : 'Light appearance'}
      </Row>
      <hr className="my-1 border-0 border-t border-subtle/70" />
      <Row
        disabled={windows.length === 0}
        onSelect={() => windows.forEach((w) => api.minimize(w.id))}
      >
        Minimize all windows
      </Row>
      <Row disabled={windows.length === 0} onSelect={() => windows.forEach((w) => api.close(w.id))}>
        Close all windows
      </Row>
      <hr className="my-1 border-0 border-t border-subtle/70" />
      <Row onSelect={() => api.setOverlay('shortcuts')} hint="?">
        Keyboard shortcuts
      </Row>
      <Row onSelect={open('about')}>About this system</Row>
    </div>
  )
}

function Row({
  children,
  onSelect,
  hint,
  disabled,
}: {
  children: React.ReactNode
  onSelect: () => void
  hint?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-sm mono text-[12px] ${
        disabled
          ? 'text-tertiary/60 cursor-default'
          : 'text-secondary hover:bg-raised hover:text-primary'
      }`}
    >
      {children}
      {hint && <span className="ml-auto text-tertiary pl-4">{hint}</span>}
    </button>
  )
}
