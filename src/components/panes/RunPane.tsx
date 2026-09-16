'use client'

import { useWorkspace } from '@/lib/workspace'
import { Pane } from '../Pane'
import { PathInstrument } from '../run/PathInstrument'
import { SortInstrument } from '../run/SortInstrument'

const TABS = [
  { id: 'sort', label: 'sort', note: 'watch a comparison sort execute one step at a time' },
  { id: 'path', label: 'path', note: 'drop walls on a grid and watch A* search it' },
] as const

export function RunPane({ seq }: { seq: number }) {
  const { state, dispatch } = useWorkspace()
  const zoomed = state.zoom === 'run'

  return (
    <Pane
      id="run"
      seq={seq}
      meta={
        <span className="flex gap-1" role="tablist" aria-label="instrument">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              title={t.note}
              aria-selected={state.run === t.id}
              onClick={() => dispatch({ type: 'run', tab: t.id })}
              className={`transition-colors ${state.run === t.id ? 'text-live' : 'text-dim hover:text-text'}`}
            >
              {state.run === t.id ? '▸' : '·'}
              {t.label}
            </button>
          ))}
        </span>
      }
    >
      {state.run === 'sort' ? <SortInstrument tall={zoomed} /> : <PathInstrument tall={zoomed} />}
    </Pane>
  )
}
