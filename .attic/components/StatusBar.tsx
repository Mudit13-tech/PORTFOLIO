'use client'

import { longDate } from '@/lib/date'
import { useReadout } from '@/lib/readout'
import { PANE_LABEL, useWorkspace } from '@/lib/workspace'
import type { Day } from '@/lib/types'
import { Sparkline } from './Sparkline'

function Mode() {
  const { state } = useWorkspace()
  const mode =
    state.overlay === 'palette'
      ? 'command'
      : state.overlay === 'help'
        ? 'help'
        : state.filter !== null
          ? 'filter'
          : state.life.running
            ? 'life'
            : state.zoom
              ? 'zoom'
              : 'normal'
  return (
    <span
      className="shrink-0 px-1 text-void"
      style={{ background: mode === 'normal' ? 'var(--c-dim)' : 'var(--c-live)' }}
    >
      {mode}
    </span>
  )
}

function Detail() {
  const r = useReadout()

  if (r.kind === 'cell') {
    const quiet = r.commits === 0 && r.solved === 0
    return (
      <span className="tabular-nums">
        <span className="text-text">{longDate(r.date)}</span>
        <span className="text-wire"> · </span>
        {quiet ? (
          <span className="text-dim">nothing recorded</span>
        ) : (
          <>
            <span className="text-live">
              {r.commits} contribution{r.commits === 1 ? '' : 's'}
            </span>
            <span className="text-wire"> · </span>
            <span className="text-cool">
              {r.solved} solved
            </span>
            {r.hardest ? (
              <>
                <span className="text-wire"> · </span>
                <span className={r.hardest === 'hard' ? 'text-alert' : 'text-dim'}>
                  hardest {r.hardest}
                </span>
              </>
            ) : null}
          </>
        )}
      </span>
    )
  }

  if (r.kind === 'life') {
    return (
      <span className="tabular-nums">
        <span className="text-live">life</span>
        <span className="text-wire"> · </span>
        <span className="text-text">gen {String(r.gen).padStart(3, '0')}</span>
        <span className="text-wire"> · </span>
        <span className="text-text">{r.alive} alive</span>
      </span>
    )
  }

  if (r.kind === 'note') {
    const tone =
      r.tone === 'live' ? 'text-live' : r.tone === 'cool' ? 'text-cool' : r.tone === 'alert' ? 'text-alert' : 'text-dim'
    return <span className={tone}>{r.text}</span>
  }

  return null
}

export function StatusBar({ days, asOf }: { days: Day[]; asOf: string }) {
  const { state, dispatch } = useWorkspace()
  const r = useReadout()

  return (
    <footer
      className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-1 border-t border-wire bg-panel px-1 text-xs"
      style={{ height: 26, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <Mode />
      <span className="shrink-0 text-dim">
        {state.zoom ? '▪ ' : ''}
        {PANE_LABEL[state.focus]}
      </span>

      <div
        className="mx-auto flex min-w-0 items-center justify-center gap-1 overflow-hidden"
        aria-live="polite"
        aria-atomic="true"
      >
        {r.kind === 'idle' ? (
          <span className="hidden items-center gap-1 sm:flex">
            <span className="text-dim">30d</span>
            <Sparkline days={days} asOf={asOf} />
          </span>
        ) : (
          <span className="truncate">
            <Detail />
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => dispatch({ type: 'theme', theme: state.theme === 'dark' ? 'light' : 'dark' })}
        title={`switch to the ${state.theme === 'dark' ? 'light' : 'dark'} theme`}
        aria-label={`switch to the ${state.theme === 'dark' ? 'light' : 'dark'} theme`}
        className="shrink-0 px-1 text-dim transition-colors hover:text-live"
      >
        {state.theme === 'dark' ? '◐' : '◑'}
      </button>

      <button
        type="button"
        onClick={() => dispatch({ type: 'overlay', overlay: 'help' })}
        className="shrink-0 whitespace-nowrap text-dim transition-colors hover:text-live"
      >
        <span className="hint text-live">press ? for keys · </span>
        <span className="hidden sm:inline">{state.hint}</span>
        <span className="sm:hidden">?</span>
      </button>
    </footer>
  )
}
