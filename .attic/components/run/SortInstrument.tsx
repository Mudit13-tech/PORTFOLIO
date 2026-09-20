'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CELL, GUT, U } from '@/lib/lattice'
import { Key, Rate, Scrubber } from './Controls'
import { ALGORITHMS, MAX_N, make, parseArray, randomArray, type Algorithm, type Frame } from './sort'
import { useStepper } from './useStepper'

const LEVELS = 12
const CHART_H = LEVELS * U - GUT

function heights(a: number[]): number[] {
  const min = Math.min(...a)
  const max = Math.max(...a)
  if (max === min) return a.map(() => Math.ceil(LEVELS / 2))
  return a.map((v) => 1 + Math.round(((v - min) / (max - min)) * (LEVELS - 1)))
}

export function SortInstrument({ tall }: { tall: boolean }) {
  const [algo, setAlgo] = useState<Algorithm>('quick')
  const [text, setText] = useState('')
  const [values, setValues] = useState<number[]>(() => randomArray(20))
  const [error, setError] = useState<string | null>(null)
  const [rate, setRate] = useState(16)
  const st = useStepper<Frame>(rate)
  const { load } = st

  const start = useCallback(
    (input: number[], a: Algorithm, autostart: boolean) => {
      setValues(input)
      setError(null)
      load(make(a, input), autostart)
    },
    [load],
  )

  useEffect(() => {
    start(values, algo, false)
    // Re-seeding on algorithm change is intentional; the array is kept.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [algo])

  const submit = useCallback(() => {
    const parsed = parseArray(text)
    if ('error' in parsed) {
      setError(parsed.error)
      return
    }
    setText('')
    start(parsed.values, algo, true)
  }, [text, algo, start])

  const frame = st.frame
  const shown = frame?.a ?? values
  const h = useMemo(() => heights(shown), [shown])
  const done = new Set(frame?.done ?? [])
  const width = shown.length * U - GUT
  const showValues = shown.length <= 16

  const fill = (i: number) => {
    if (frame?.swap && (frame.swap[0] === i || frame.swap[1] === i)) return 'var(--r-gh-4)'
    if (frame?.pivot === i) return 'var(--c-live)'
    if (frame?.compare && (frame.compare[0] === i || frame.compare[1] === i)) return 'var(--c-cool)'
    if (done.has(i)) return 'var(--r-gh-2)'
    return 'var(--c-wire)'
  }

  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-1">
        <div className="flex gap-1" role="tablist" aria-label="algorithm">
          {ALGORITHMS.map((a) => (
            <button
              key={a.id}
              type="button"
              role="tab"
              aria-selected={algo === a.id}
              title={a.note}
              onClick={() => setAlgo(a.id)}
              className={`text-xs transition-colors ${algo === a.id ? 'text-live' : 'text-dim hover:text-text'}`}
            >
              {algo === a.id ? '▸' : ' '}
              {a.label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-dim tabular-nums">
          n {shown.length} · {frame?.comparisons ?? 0} cmp · {frame?.writes ?? 0} wr
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg
          width={width}
          height={CHART_H}
          viewBox={`0 0 ${width} ${CHART_H}`}
          role="img"
          aria-label={`${shown.length} values, ${frame?.note ?? 'idle'}`}
          className="block"
        >
          {shown.map((_, i) => {
            const bh = h[i] * U - GUT
            return (
              <rect
                key={i}
                x={i * U}
                y={CHART_H - bh}
                width={CELL}
                height={bh}
                fill={fill(i)}
                style={{ transition: 'fill 90ms linear' }}
              />
            )
          })}
        </svg>
        {showValues && (
          <div className="flex text-dim" style={{ width, fontSize: 11, lineHeight: '13px' }}>
            {shown.map((v, i) => (
              <span
                key={i}
                className="text-center tabular-nums"
                style={{ width: CELL, marginRight: GUT }}
              >
                {v}
              </span>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-dim" aria-live="polite" style={{ minHeight: 13 }}>
        {error ? <span className="text-alert">{error}</span> : frame?.note}
      </p>

      <Scrubber at={st.at} length={st.length} onSeek={st.seek} label="sort step" />

      <div className="flex flex-wrap items-center gap-1">
        <Key title={st.running ? 'pause' : 'run'} onClick={st.toggle} active={st.running}>
          {st.running ? '❙❙' : '▸'}
        </Key>
        <Key title="step back" onClick={st.back} disabled={st.at <= 0}>
          ◂|
        </Key>
        <Key title="step forward" onClick={st.forward} disabled={st.finished && st.at >= st.length - 1}>
          |▸
        </Key>
        <Key title="restart with the same array" onClick={() => start(values, algo, false)}>
          ↺
        </Key>
        <Key title="new random array" onClick={() => start(randomArray(tall ? 28 : 20), algo, true)}>
          shuffle
        </Key>
        <Rate value={rate} onChange={setRate} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="flex items-center gap-1 border-t border-wire pt-1"
      >
        <label htmlFor="sort-input" className="text-xs text-live">
          &gt;
        </label>
        <input
          id="sort-input"
          ref={inputRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setError(null)
          }}
          onKeyDown={(e) => e.stopPropagation()}
          placeholder={`paste up to ${MAX_N} numbers — [5, 3, 8, 1] or 5 3 8 1`}
          spellCheck={false}
          autoComplete="off"
          className="w-full bg-transparent text-xs text-text outline-none placeholder:text-dim"
        />
        <button type="submit" className="text-xs text-dim hover:text-live">
          sort
        </button>
      </form>
    </div>
  )
}
