'use client'

import { useEffect, useRef } from 'react'
import type { Snapshot } from '@/lib/types'
import { useStacked, useWorkspace, WorkspaceProvider, type Dir } from '@/lib/workspace'
import { Boot } from './Boot'
import { CommandPalette } from './CommandPalette'
import { HelpOverlay } from './HelpOverlay'
import { StatusBar } from './StatusBar'
import { ActivityPane } from './panes/ActivityPane'
import { LogPane } from './panes/LogPane'
import { PsPane } from './panes/PsPane'
import { RunPane } from './panes/RunPane'
import { WhoamiPane } from './panes/WhoamiPane'

const MOVE: Record<string, Dir> = {
  h: 'h', j: 'j', k: 'k', l: 'l',
  ArrowLeft: 'h', ArrowDown: 'j', ArrowUp: 'k', ArrowRight: 'l',
}

function Keys() {
  const { state, dispatch } = useWorkspace()
  const stacked = useStacked()
  const stackedRef = useRef(stacked)
  stackedRef.current = stacked

  useEffect(() => {
    const dismissHint = () => {
      const root = document.documentElement
      if (root.dataset.hint !== '1') return
      delete root.dataset.hint
      try {
        localStorage.setItem('ics:hinted', '1')
      } catch {
        /* nothing to remember it with; it simply shows again */
      }
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement | null
      const typing =
        !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)

      if (e.key === 'Escape') {
        dismissHint()
        dispatch({ type: 'escape' })
        if (typing) t?.blur()
        return
      }
      if (typing) return

      // Inside the calendar the arrows belong to the calendar, which moves the
      // day cursor and stops the event before it reaches here.
      const inCells = Boolean(t?.closest('[data-cells]'))

      switch (e.key) {
        case '?':
          e.preventDefault()
          dispatch({ type: 'overlay', overlay: 'help' })
          break
        case ':':
          e.preventDefault()
          dispatch({ type: 'overlay', overlay: 'palette' })
          break
        case '/':
          e.preventDefault()
          dispatch({ type: 'filter', value: '' })
          break
        case 'Enter':
          if (t?.tagName === 'BUTTON' || t?.tagName === 'A') return
          e.preventDefault()
          dispatch({ type: 'zoom' })
          break
        case 'g':
          e.preventDefault()
          dispatch({ type: 'focus', pane: 'activity' })
          dispatch({ type: 'life', running: true })
          break
        case 'r':
          e.preventDefault()
          dispatch({ type: 'life', running: false })
          break
        default:
          if (MOVE[e.key] && !inCells) {
            e.preventDefault()
            dispatch({ type: 'move', dir: MOVE[e.key], stacked: stackedRef.current })
          } else {
            return
          }
      }
      dismissHint()
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch])

  /* Theme: the inline script in the document head owns the first paint, so the
     first pass here reads the attribute rather than overwriting it. */
  const synced = useRef(false)
  useEffect(() => {
    const root = document.documentElement
    if (!synced.current) {
      synced.current = true
      const t = root.dataset.theme
      if ((t === 'light' || t === 'dark') && t !== state.theme) {
        dispatch({ type: 'theme', theme: t })
        return
      }
    }
    root.dataset.theme = state.theme
    try {
      localStorage.setItem('ics:theme', state.theme)
    } catch {
      /* the choice lasts for this visit only */
    }
  }, [state.theme, dispatch])

  return null
}

function Tiles({ snapshot, attach }: { snapshot: Snapshot; attach?: string }) {
  const { state, dispatch } = useWorkspace()

  useEffect(() => {
    if (attach) dispatch({ type: 'attach', slug: attach })
  }, [attach, dispatch])

  return (
    <>
      <Keys />
      <main id="workspace" className="tiles" data-zoom={state.zoom ?? undefined}>
        <WhoamiPane snapshot={snapshot} seq={0} />
        <ActivityPane snapshot={snapshot} seq={1} />
        <PsPane seq={3} />
        <RunPane seq={4} />
        <LogPane snapshot={snapshot} seq={2} />
      </main>
      <CommandPalette />
      <HelpOverlay />
      <StatusBar days={snapshot.days} />
      <Boot snapshot={snapshot} />
    </>
  )
}

export function Workspace({ snapshot, attach }: { snapshot: Snapshot; attach?: string }) {
  return (
    <WorkspaceProvider>
      <Tiles snapshot={snapshot} attach={attach} />
    </WorkspaceProvider>
  )
}
