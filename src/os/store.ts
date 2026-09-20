import { MAX_WINDOWS, Z_BASE } from './constants'
import { cascade, clampSize, clampToViewport, maximizedRect, renormalise, snapRect } from './geometry'
import { loadLayout, saveLayout } from './persist'
import type { AppId, Rect, SystemApi, SystemState, Viewport, WindowState } from './types'

/**
 * The system store. Plain subscribe/getState — no React in this file, so every
 * command can be reasoned about (and tested) without rendering anything.
 */

export interface Store extends SystemApi {
  getState(): SystemState
  subscribe(fn: () => void): () => void
}

const DEFAULT_SIZE: Record<AppId, { w: number; h: number }> = {
  projects: { w: 760, h: 560 },
  failures: { w: 720, h: 580 },
  skills: { w: 660, h: 540 },
  experiments: { w: 680, h: 520 },
  // Wide enough for a full 53-week calendar without a horizontal scroll, and
  // tall enough that both of them are on the first screen.
  monitor: { w: 880, h: 720 },
  about: { w: 560, h: 520 },
  contact: { w: 520, h: 460 },
  terminal: { w: 680, h: 420 },
  bin: { w: 560, h: 440 },
}

function initialState(): SystemState {
  return {
    booted: false,
    windows: [],
    focusOrder: [],
    nextZ: Z_BASE,
    visited: [],
    evicted: null,
    overlay: null,
    devMode: false,
    sessionStart: Date.now(),
    revealShown: false,
    eggs: [],
  }
}

export function createStore(): Store {
  let state = initialState()
  let viewport: Viewport = { w: 1440, h: 900 }
  let hydrated = false
  const listeners = new Set<() => void>()

  const emit = () => {
    for (const fn of listeners) fn()
  }

  const set = (next: Partial<SystemState>) => {
    state = { ...state, ...next }
    emit()
    persist()
  }

  let persistTimer: ReturnType<typeof setTimeout> | null = null
  function persist() {
    if (persistTimer) clearTimeout(persistTimer)
    persistTimer = setTimeout(() => {
      saveLayout({
        windows: state.windows.map(({ id, payload, rect, maximized, minimized }) => ({
          id,
          payload,
          rect,
          maximized,
          minimized,
        })),
        focusOrder: state.focusOrder,
      })
    }, 400)
  }

  const find = (id: AppId) => state.windows.find((w) => w.id === id)

  function raise(id: AppId): { z: number; nextZ: number } {
    const z = state.nextZ
    return { z, nextZ: state.nextZ + 1 }
  }

  const api: Store = {
    getState: () => state,

    subscribe(fn) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },

    setViewport(v) {
      viewport = v
      // Pull any window that the new viewport would have stranded back inside.
      const windows = state.windows.map((w) =>
        w.maximized ? { ...w, rect: maximizedRect(v) } : { ...w, rect: clampToViewport(w.rect, v) },
      )
      set({ windows })
    },

    open(id, payload = null, opts) {
      const existing = find(id)
      if (existing) {
        const { z, nextZ } = raise(id)
        set({
          windows: state.windows.map((w) =>
            w.id === id ? { ...w, payload: payload ?? w.payload, minimized: false, z } : w,
          ),
          focusOrder: [...state.focusOrder.filter((x) => x !== id), id],
          nextZ,
        })
        return
      }

      let windows = state.windows
      let evicted: AppId | null = null

      // Opening a seventh closes the oldest unfocused one.
      if (windows.length >= MAX_WINDOWS) {
        const oldest = state.focusOrder.find((x) => x !== state.focusOrder.at(-1))
        if (oldest) {
          evicted = oldest
          windows = windows.filter((w) => w.id !== oldest)
        }
      }

      const { z, nextZ } = raise(id)
      const next: WindowState = {
        id,
        payload,
        minimized: false,
        maximized: false,
        z,
        rect: cascade(windows.length, DEFAULT_SIZE[id], viewport),
        restore: null,
        fromServer: Boolean(opts?.fromServer),
      }

      set({
        windows: [...windows, next],
        focusOrder: [...state.focusOrder.filter((x) => x !== id && x !== evicted), id],
        nextZ,
        evicted,
        visited: state.visited.includes(id) ? state.visited : [...state.visited, id],
      })

      if (evicted) setTimeout(() => set({ evicted: null }), 600)
    },

    close(id) {
      set({
        windows: state.windows.filter((w) => w.id !== id),
        focusOrder: state.focusOrder.filter((x) => x !== id),
      })
    },

    focus(id) {
      if (state.focusOrder.at(-1) === id && !find(id)?.minimized) return
      const { z, nextZ } = raise(id)
      const r = renormalise(
        state.windows.map((w) => (w.id === id ? { ...w, z, minimized: false } : w)),
        nextZ,
      )
      set({ windows: r.windows, nextZ: r.nextZ, focusOrder: [...state.focusOrder.filter((x) => x !== id), id] })
    },

    minimize(id) {
      set({
        windows: state.windows.map((w) => (w.id === id ? { ...w, minimized: true } : w)),
        focusOrder: state.focusOrder.filter((x) => x !== id),
      })
    },

    toggleMaximize(id) {
      set({
        windows: state.windows.map((w) => {
          if (w.id !== id) return w
          if (w.maximized) {
            return { ...w, maximized: false, rect: w.restore ?? w.rect, restore: null }
          }
          return { ...w, maximized: true, restore: w.rect, rect: maximizedRect(viewport) }
        }),
      })
    },

    move(id, x, y) {
      set({
        windows: state.windows.map((w) =>
          w.id === id ? { ...w, rect: clampToViewport({ ...w.rect, x, y }, viewport) } : w,
        ),
      })
    },

    resize(id, rect) {
      set({
        windows: state.windows.map((w) => (w.id === id ? { ...w, rect: clampSize(rect, viewport) } : w)),
      })
    },

    snap(id, side) {
      set({
        windows: state.windows.map((w) =>
          w.id === id
            ? { ...w, maximized: side === 'top', restore: w.maximized ? w.restore : w.rect, rect: snapRect(side, viewport) }
            : w,
        ),
      })
    },

    cycle() {
      const open = state.windows.filter((w) => !w.minimized)
      if (open.length < 2) return
      const current = state.focusOrder.at(-1)
      const i = open.findIndex((w) => w.id === current)
      api.focus(open[(i + 1) % open.length].id)
    },

    closeFocused() {
      const id = state.focusOrder.at(-1)
      if (id) api.close(id)
    },

    setBooted(v) {
      set({ booted: v })
    },

    setOverlay(v) {
      set({ overlay: v, revealShown: v === 'reveal' ? true : state.revealShown })
    },

    toggleDevMode() {
      set({ devMode: !state.devMode })
    },

    findEgg(id) {
      if (state.eggs.includes(id)) return
      set({ eggs: [...state.eggs, id] })
    },

    /**
     * Restore a returning visitor's desk. Called from an effect after mount,
     * never during render.
     *
     * Reading localStorage while rendering is what broke this: the first
     * client render disagreed with the server's, React threw the whole tree
     * away and rebuilt it, and on a document React owns that takes <html>'s
     * attributes with it — including the one the pre-paint script sets. The
     * system would vanish and the plain document would appear in its place,
     * for exactly the visitors who had been here before. A saved desk is worth
     * one extra frame. It is not worth that.
     */
    hydrate() {
      if (hydrated) return
      hydrated = true

      const saved = loadLayout()
      if (!saved?.windows.length) return

      // A deep link may already have opened something. It stays, and it stays
      // on top.
      const open = new Set(state.windows.map((w) => w.id))
      const restored: WindowState[] = saved.windows
        .filter((w) => !open.has(w.id))
        .map((w, i) => ({
          ...w,
          rect: w.maximized ? maximizedRect(viewport) : clampToViewport(w.rect, viewport),
          z: Z_BASE + i,
          restore: null,
          fromServer: false,
        }))
      if (!restored.length) return

      const lifted = state.windows.map((w, i) => ({ ...w, z: Z_BASE + restored.length + i }))

      set({
        windows: [...restored, ...lifted],
        focusOrder: [...saved.focusOrder.filter((id) => !open.has(id)), ...state.focusOrder],
        nextZ: Z_BASE + restored.length + lifted.length,
        visited: [...new Set([...state.visited, ...restored.map((w) => w.id)])],
      })
    },

    reset() {
      try {
        window.localStorage.clear()
      } catch {
        /* private mode — nothing to clear, and nothing to report */
      }
      state = initialState()
      hydrated = false
      emit()
    },
  }

  return api
}
