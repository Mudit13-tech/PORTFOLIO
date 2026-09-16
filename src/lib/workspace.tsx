'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react'
export type PaneId = 'whoami' | 'activity' | 'ps' | 'run' | 'log'
export const PANES: PaneId[] = ['whoami', 'activity', 'ps', 'run', 'log']
export const PANE_LABEL: Record<PaneId, string> = {
  whoami: 'whoami',
  activity: 'activity',
  ps: 'ps',
  run: './run',
  log: 'log',
}

export type Overlay = null | 'help' | 'palette'
export type Theme = 'dark' | 'light'

export interface State {
  focus: PaneId
  zoom: PaneId | null
  overlay: Overlay
  /** Non-null means the process filter is open, even when empty. */
  filter: string | null
  attached: string | null
  /** The calendar is showing the simulation rather than the measured year. */
  life: { running: boolean }
  /** Which instrument the run pane has loaded. */
  run: 'sort' | 'path'
  theme: Theme
  /** Which pane's hint the status bar should show next. */
  hint: string
}

export type Action =
  | { type: 'focus'; pane: PaneId }
  | { type: 'move'; dir: Dir; stacked: boolean }
  | { type: 'zoom'; pane?: PaneId }
  | { type: 'escape' }
  | { type: 'overlay'; overlay: Overlay }
  | { type: 'filter'; value: string | null }
  | { type: 'attach'; slug: string | null }
  | { type: 'life'; running: boolean }
  | { type: 'run'; tab: State['run'] }
  | { type: 'theme'; theme: Theme }

export type Dir = 'h' | 'j' | 'k' | 'l'

/** Spatial neighbours in the tiled layout. Mirrors the grid areas exactly. */
const TILED: Record<PaneId, Partial<Record<Dir, PaneId>>> = {
  whoami: { l: 'activity', j: 'log' },
  activity: { h: 'whoami', j: 'ps' },
  log: { l: 'ps', k: 'whoami' },
  ps: { h: 'log', k: 'activity', l: 'run' },
  run: { h: 'ps', k: 'activity' },
}

/** In the stacked layout there is only one axis, so all four keys use it. */
const STACK_ORDER: PaneId[] = ['whoami', 'activity', 'ps', 'run', 'log']

function move(from: PaneId, dir: Dir, stacked: boolean): PaneId {
  if (stacked) {
    const i = STACK_ORDER.indexOf(from)
    const step = dir === 'j' || dir === 'l' ? 1 : -1
    return STACK_ORDER[Math.min(STACK_ORDER.length - 1, Math.max(0, i + step))]
  }
  return TILED[from][dir] ?? from
}

export const HINTS: Record<PaneId, string> = {
  whoami: ': for commands',
  activity: 'g seeds life',
  ps: '/ filters',
  run: 'enter zooms',
  log: 'enter zooms',
}

export const initialState: State = {
  focus: 'activity',
  zoom: null,
  overlay: null,
  filter: null,
  attached: null,
  life: { running: false },
  run: 'sort',
  theme: 'dark',
  hint: HINTS.activity,
}

export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'focus':
      return s.focus === a.pane ? s : { ...s, focus: a.pane, hint: HINTS[a.pane] }
    case 'move': {
      const next = move(s.focus, a.dir, a.stacked)
      return next === s.focus ? s : { ...s, focus: next, hint: HINTS[next] }
    }
    case 'zoom': {
      const pane = a.pane ?? s.focus
      return { ...s, zoom: s.zoom === pane ? null : pane, focus: pane, hint: s.zoom === pane ? HINTS[pane] : 'esc restores' }
    }
    case 'escape':
      if (s.overlay) return { ...s, overlay: null }
      if (s.filter !== null) return { ...s, filter: null }
      if (s.attached) return { ...s, attached: null }
      if (s.zoom) return { ...s, zoom: null, hint: HINTS[s.focus] }
      return s
    case 'overlay':
      return { ...s, overlay: a.overlay, hint: a.overlay ? 'esc closes' : HINTS[s.focus] }
    case 'filter':
      return { ...s, filter: a.value, focus: 'ps' }
    case 'attach':
      return { ...s, attached: a.slug, zoom: a.slug ? 'ps' : s.zoom, focus: 'ps' }
    case 'life':
      return s.life.running === a.running
        ? s
        : { ...s, life: { running: a.running }, hint: a.running ? 'r restores data' : HINTS[s.focus] }
    case 'run':
      return { ...s, run: a.tab, focus: 'run' }
    case 'theme':
      return { ...s, theme: a.theme }
    default:
      return s
  }
}

const Ctx = createContext<{ state: State; dispatch: Dispatch<Action> } | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const value = useMemo(() => ({ state, dispatch }), [state])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useWorkspace() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useWorkspace outside provider')
  return ctx
}

/* ------------------------------------------------------------------ hooks */

export function useMediaQuery(query: string, fallback = false) {
  const [match, setMatch] = useState(fallback)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatch(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return match
}

export const useStacked = () => useMediaQuery('(width < 754px)')
export const useQuiet = () => useMediaQuery('(prefers-reduced-motion: reduce)')

/** Moves real DOM focus to a pane when the workspace focus changes. */
export function usePaneRef(id: PaneId) {
  const ref = useRef<HTMLElement | null>(null)
  const { state } = useWorkspace()
  const first = useRef(true)
  useEffect(() => {
    if (state.focus !== id) return
    if (first.current) {
      first.current = false
      return
    }
    const el = ref.current
    if (!el) return
    if (el.contains(document.activeElement)) return
    el.focus({ preventScroll: true })
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [state.focus, id])
  return ref
}
