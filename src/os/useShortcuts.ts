'use client'

import { useEffect } from 'react'
import { APP_ORDER } from './routes'
import { useSystemApi } from './SystemProvider'

/**
 * The global keymap. Discoverable via `?` and listed in the terminal's `help`,
 * because a shortcut nobody can find is a shortcut that does not exist.
 */
export function useShortcuts(enabled: boolean) {
  const api = useSystemApi()

  useEffect(() => {
    if (!enabled) return

    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const typing =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable

      // Esc closes the focused window even while typing, so the terminal is
      // never a trap.
      if (e.key === 'Escape') {
        const { overlay } = api.getState()
        if (overlay) api.setOverlay(null)
        else api.closeFocused()
        return
      }

      if (typing) return

      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        const { overlay } = api.getState()
        api.setOverlay(overlay === 'shortcuts' ? null : 'shortcuts')
        return
      }

      const mod = e.ctrlKey || e.metaKey
      if (!mod) return

      if (e.shiftKey) {
        if (e.key.toLowerCase() === 'd') {
          e.preventDefault()
          api.toggleDevMode()
          api.findEgg('dev-mode')
        }
        // Ctrl+Shift+R replays the boot sequence — how you demo it in an
        // interview without opening a private window.
        if (e.key.toLowerCase() === 'r') {
          e.preventDefault()
          api.reset()
          window.location.href = '/?boot=1'
        }
        return
      }

      switch (e.key) {
        case 'k': {
          e.preventDefault()
          const { overlay } = api.getState()
          api.setOverlay(overlay === 'launcher' ? null : 'launcher')
          break
        }
        case '`':
          e.preventDefault()
          api.cycle()
          break
        case 'w':
          e.preventDefault()
          api.closeFocused()
          break
        case 't':
          e.preventDefault()
          api.open('terminal')
          break
        case 'm': {
          e.preventDefault()
          const id = api.getState().focusOrder.at(-1)
          if (id) api.minimize(id)
          break
        }
        case 'ArrowUp': {
          e.preventDefault()
          const id = api.getState().focusOrder.at(-1)
          if (id) api.toggleMaximize(id)
          break
        }
        case 'ArrowLeft':
        case 'ArrowRight': {
          e.preventDefault()
          const id = api.getState().focusOrder.at(-1)
          if (id) api.snap(id, e.key === 'ArrowLeft' ? 'left' : 'right')
          break
        }
        default: {
          const n = Number(e.key)
          if (n >= 1 && n <= 8) {
            e.preventDefault()
            const app = APP_ORDER[n - 1]
            if (app) api.open(app)
          }
        }
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [api, enabled])
}
