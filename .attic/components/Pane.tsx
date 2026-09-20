'use client'

import type { ReactNode } from 'react'
import { PANE_LABEL, usePaneRef, useWorkspace, type PaneId } from '@/lib/workspace'

/**
 * One tile.
 *
 * Underneath the window-manager metaphor this is a labelled section with a
 * heading, so a screen reader is handed a document rather than a workspace.
 */
export function Pane({
  id,
  meta,
  seq,
  children,
  bodyClass = '',
}: {
  id: PaneId
  /** Right-aligned detail in the title bar. */
  meta?: ReactNode
  seq: number
  children: ReactNode
  bodyClass?: string
}) {
  const { state, dispatch } = useWorkspace()
  const ref = usePaneRef(id)
  const focused = state.focus === id
  const zoomed = state.zoom === id

  return (
    <section
      ref={ref as React.Ref<HTMLElement>}
      id={`pane-${id}`}
      aria-labelledby={`pane-${id}-title`}
      tabIndex={-1}
      data-focused={focused}
      data-pane={id}
      className="pane allocate outline-none"
      style={{ gridArea: id, ['--seq' as string]: seq }}
      onFocusCapture={() => dispatch({ type: 'focus', pane: id })}
      onPointerDown={() => dispatch({ type: 'focus', pane: id })}
    >
      <h2 className="pane-title" id={`pane-${id}-title`}>
        <span className="pane-tick" aria-hidden="true" />
        <span className={focused ? 'text-live' : ''}>{PANE_LABEL[id]}</span>
        {meta ? <span className="ml-auto truncate text-dim">{meta}</span> : null}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            dispatch({ type: 'zoom', pane: id })
          }}
          title={zoomed ? `restore ${PANE_LABEL[id]}` : `zoom ${PANE_LABEL[id]} to fill the workspace`}
          aria-label={zoomed ? `restore ${PANE_LABEL[id]}` : `zoom ${PANE_LABEL[id]}`}
          aria-pressed={zoomed}
          className={`${meta ? '' : 'ml-auto'} shrink-0 px-1 text-dim transition-colors hover:text-live`}
        >
          {zoomed ? '▪' : '▫'}
        </button>
      </h2>
      <div className={`pane-body ${bodyClass}`}>{children}</div>
    </section>
  )
}

/**
 * Shared voice for a pane with nothing to report. `compact` is for a slot
 * inside an otherwise full pane, where centring in the whole body would push
 * real content off the bottom.
 */
export function Idle({ line, hint, compact }: { line: string; hint?: string; compact?: boolean }) {
  return (
    <div
      className={`flex flex-col text-xs ${compact ? '' : 'h-full justify-center gap-1 py-2'}`}
    >
      <p className="text-dim">
        <span className="text-wire">— </span>
        {line}
      </p>
      {hint ? <p className="text-dim">{hint}</p> : null}
    </div>
  )
}

/** Shared voice for a channel that answered badly or not at all. */
export function Fault({ line, hint }: { line: string; hint?: string }) {
  return (
    <div className="flex h-full flex-col justify-center gap-1 py-2 text-xs" role="status">
      <p className="text-alert">
        <span aria-hidden="true">! </span>
        {line}
      </p>
      {hint ? <p className="text-dim">{hint}</p> : null}
    </div>
  )
}
