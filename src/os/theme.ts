'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { writeFlag } from './persist'

export type Theme = 'dark' | 'light'

/**
 * Theme, owned by the document rather than by React.
 *
 * The inline script in the root layout stamps `data-theme` before first paint,
 * so this hook never decides the theme — it reads the decision that was
 * already made and toggles it. That is why there is no flash, and why the
 * server snapshot is `null`: the server cannot know which theme the visitor's
 * browser resolved, and guessing would be a hydration mismatch on every load.
 *
 * The subscription is shared. Three different controls can change the
 * appearance — the menu bar button, the System menu and the desk menu — and
 * per-component state would leave two of them describing a theme the document
 * is no longer in.
 */
const listeners = new Set<() => void>()

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function read(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

export function useTheme(): { theme: Theme | null; toggle: () => void } {
  const theme = useSyncExternalStore(subscribe, read, () => null)

  const toggle = useCallback(() => {
    const next: Theme = read() === 'light' ? 'dark' : 'light'
    document.documentElement.dataset.theme = next
    writeFlag('theme', next)
    for (const fn of listeners) fn()
  }, [])

  return { theme, toggle }
}
