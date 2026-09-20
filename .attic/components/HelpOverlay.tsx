'use client'

import { useEffect, useRef } from 'react'
import { useWorkspace } from '@/lib/workspace'

const KEYS: Array<[string, string]> = [
  ['h j k l', 'move focus between panes'],
  ['← ↓ ↑ →', 'the same, without vim'],
  ['enter', 'zoom the focused pane to fill the workspace'],
  ['esc', 'restore, detach, or close whatever is open'],
  [':', 'command palette'],
  ['/', 'filter the process table'],
  ['g', 'seed life from the real year of activity'],
  ['r', 'restore the measured data'],
  ['?', 'this list'],
]

const CELLS: Array<[string, string]> = [
  ['← ↓ ↑ →', 'move one day, inside the calendar'],
  ['page up / down', 'move four weeks'],
  ['end', 'jump to today'],
]

const COMMANDS: Array<[string, string]> = [
  [':work', 'open the process table'],
  [':about', 'focus whoami'],
  [':cv', 'open the cv'],
  [':theme light', 'switch theme (also :theme dark)'],
  [':gh  ·  :lc', 'open the github and leetcode profiles'],
  [':run sort  ·  :run path', 'load an instrument'],
]

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-1 text-xs">
      <kbd className="shrink-0 text-live" style={{ width: 130 }}>
        {k}
      </kbd>
      <span className="text-dim">{v}</span>
    </div>
  )
}

function Group({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <section className="flex flex-col gap-1">
      <h3 className="text-xs text-dim">{title}</h3>
      {rows.map(([k, v]) => (
        <Row key={k} k={k} v={v} />
      ))}
    </section>
  )
}

export function HelpOverlay() {
  const { state, dispatch } = useWorkspace()
  const ref = useRef<HTMLDivElement>(null)
  const open = state.overlay === 'help'

  useEffect(() => {
    if (open) ref.current?.focus()
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-void/80 p-2"
      onClick={() => dispatch({ type: 'overlay', overlay: null })}
      style={{ backdropFilter: 'blur(2px)' }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="allocate max-h-full w-full overflow-auto border border-live bg-panel outline-none"
        style={{ maxWidth: 611 }}
      >
        <h2
          id="help-title"
          className="flex items-center gap-1 border-b border-wire px-1 text-xs text-live"
          style={{ height: 26 }}
        >
          <span aria-hidden="true" className="inline-block" style={{ width: 11, height: 11, background: 'var(--c-live)' }} />
          bindings
          <button
            type="button"
            onClick={() => dispatch({ type: 'overlay', overlay: null })}
            className="ml-auto text-dim hover:text-live"
          >
            esc
          </button>
        </h2>

        <div className="flex flex-col gap-2 p-1">
          <Group title="workspace" rows={KEYS} />
          <Group title="calendar" rows={CELLS} />
          <Group title="commands" rows={COMMANDS} />
          <p className="rule pt-1 text-xs text-dim">
            every binding here is also a button, a link or a tap target. the keyboard is a
            shortcut, not the entrance.
          </p>
        </div>
      </div>
    </div>
  )
}
