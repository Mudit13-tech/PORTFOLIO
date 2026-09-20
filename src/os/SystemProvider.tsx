'use client'

import { createContext, useContext, useEffect, useRef, useSyncExternalStore } from 'react'
import { BP_DESKTOP, BP_TABLET } from './constants'
import { readFlag } from './persist'
import { createStore, type Store } from './store'
import type { ShellKind, SystemState } from './types'

const StoreContext = createContext<Store | null>(null)

export function SystemProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<Store | null>(null)
  ref.current ??= createStore()
  const store = ref.current

  useEffect(() => {
    const sync = () => store.setViewport({ w: window.innerWidth, h: window.innerHeight })
    sync()
    // The real viewport first, then the saved desk — so a restored window is
    // clamped to this screen rather than to the 1440x900 the store assumes
    // before it has been told otherwise.
    store.hydrate()

    // The pre-paint script sets data-theme on <html>. If React ever has to
    // regenerate the document, that attribute goes with it, so it is
    // re-asserted here from the same source of truth.
    const root = document.documentElement
    if (root.dataset.theme !== 'light' && root.dataset.theme !== 'dark') {
      const saved = readFlag('theme')
      root.dataset.theme =
        saved === 'light' || saved === 'dark'
          ? saved
          : window.matchMedia('(prefers-color-scheme: light)').matches
            ? 'light'
            : 'dark'
    }

    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [store])

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

function useStore(): Store {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useSystem must be used inside <SystemProvider>')
  return store
}

/**
 * Selector subscription. The selector must return a stable value — a primitive
 * or a memoised reference — because a new object every call would re-render on
 * every store change and undo the point of selecting.
 */
export function useSystem<T>(selector: (s: SystemState) => T): T {
  const store = useStore()
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState()),
  )
}

/** The commands. Stable for the lifetime of the provider. */
export function useSystemApi(): Store {
  return useStore()
}

/**
 * Which shell to render. Starts as 'desktop' on the server so the markup is
 * stable, then corrects on mount — the shells share every content component, so
 * a correction swaps chrome and nothing else.
 */
export function useShellKind(): ShellKind {
  return useSyncExternalStore(
    (fn) => {
      const mq = window.matchMedia(`(max-width: ${BP_DESKTOP - 1}px)`)
      mq.addEventListener('change', fn)
      window.addEventListener('resize', fn)
      return () => {
        mq.removeEventListener('change', fn)
        window.removeEventListener('resize', fn)
      }
    },
    () => {
      const w = window.innerWidth
      if (w < BP_TABLET) return 'mobile' as const
      if (w < BP_DESKTOP) return 'tablet' as const
      return 'desktop' as const
    },
    () => 'desktop' as const,
  )
}
