'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { completions, run, type Line } from './engine'
import { useSystemApi } from '@/os/SystemProvider'
import { pathFor } from '@/os/routes'
import { buildVersion, meta, profile } from '~/data'
import { counts } from '@/lib/derived'

/**
 * The terminal.
 *
 * Tab completion, history and `clear` are non-negotiable — without them this is
 * a costume. Output is an ARIA live region so a screen reader announces
 * responses, and commands that open windows echo the path so the connection
 * between typing and the desktop is visible rather than magical.
 */
export function TerminalApp() {
  const api = useSystemApi()
  // The banner is built from the same data the windows render, so it can never
  // announce a count the rest of the system disagrees with.
  const [lines, setLines] = useState<Line[]>([
    { kind: 'note', text: `${meta.systemName} · build ${buildVersion}` },
    {
      kind: 'note',
      text: `${counts.projects} projects · ${counts.failures} crash reports · ${counts.skills} modules mounted`,
    },
    { kind: 'out', text: 'type `help` for commands, `ls` to look around' },
    { kind: 'note', text: '' },
  ])
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  /** Which column the caret is drawn at — the field's own selection point. */
  const [col, setCol] = useState(0)
  const [cwd, setCwd] = useState('/')
  const history = useRef<string[]>([])
  const cursor = useRef(-1)
  const scroller = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight })
  }, [lines])

  const submit = useCallback(
    (raw: string) => {
      const result = run(raw, cwd)
      history.current = [raw, ...history.current].slice(0, 50)
      cursor.current = -1

      if (result.clear) {
        setLines([])
      } else {
        setLines((prev) => [...prev, { kind: 'in', text: raw }, ...result.lines])
      }

      setCwd(result.cwd)

      if (result.theme) {
        document.documentElement.dataset.theme = result.theme
        try {
          window.localStorage.setItem('mudit-os.v1.theme', result.theme)
        } catch {
          /* private mode */
        }
      }

      const cmd = raw.trim().split(/\s+/)[0]
      if (cmd === 'github') window.open(profile.links.github, '_blank', 'noopener')
      if (cmd === 'leetcode') window.open(profile.links.leetcode, '_blank', 'noopener')
      if (cmd === 'resume' && profile.links.resume) window.open(profile.links.resume, '_blank', 'noopener')

      if (result.open) {
        api.open(result.open.id, result.open.payload)
        window.history.pushState(null, '', pathFor(result.open))
        if (raw.trim() === 'sudo hire-mudit') api.findEgg('hire')
      }
    },
    [api, cwd],
  )

  const syncCol = (e: React.SyntheticEvent<HTMLInputElement>) => {
    setCol(e.currentTarget.selectionStart ?? e.currentTarget.value.length)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit(value)
      setValue('')
      setCol(0)
      return
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      const options = completions(value, cwd)
      if (options.length === 1) {
        const parts = value.split(/\s+/)
        parts[parts.length - 1] = options[0]
        const completed = parts.join(' ')
        setValue(completed)
        setCol(completed.length)
      } else if (options.length > 1) {
        setLines((prev) => [...prev, { kind: 'out', text: options.join('  ') }])
      }
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      cursor.current = Math.min(cursor.current + 1, history.current.length - 1)
      const recalled = history.current[cursor.current] ?? ''
      setValue(recalled)
      setCol(recalled.length)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      cursor.current = Math.max(cursor.current - 1, -1)
      const next = cursor.current === -1 ? '' : (history.current[cursor.current] ?? '')
      setValue(next)
      setCol(next.length)
    }
  }

  const prompt = `mudit@os ${cwd} %`

  return (
    <div className="terminal h-full flex flex-col" onClick={() => input.current?.focus()}>
      <div
        ref={scroller}
        className="flex-1 overflow-auto px-4 pt-3.5 pb-2 mono text-[13px] leading-[1.7] term-col"
      >
        <div role="log" aria-live="polite" aria-label="Terminal output">
          {lines.map((l, i) => (
            <p
              key={i}
              className={
                l.kind === 'in'
                  ? 'text-primary'
                  : l.kind === 'err'
                    ? 'text-error'
                    : l.kind === 'note'
                      ? 'text-tertiary'
                      : 'text-secondary'
              }
            >
              {l.kind === 'in' ? <Prompt cwd={cwd} /> : null}
              {l.text || ' '}
            </p>
          ))}
        </div>
      </div>

      <div className="term-rail flex items-center gap-2 px-4 py-2.5 mono text-[13px] shrink-0">
        <label htmlFor="term-input" className="shrink-0">
          <span className="sr-only">{prompt}</span>
          <Prompt cwd={cwd} />
        </label>
        <span className="relative flex-1 overflow-hidden">
          <input
            id="term-input"
            ref={input}
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setCol(e.target.selectionStart ?? e.target.value.length)
            }}
            onKeyDown={onKeyDown}
            onKeyUp={syncCol}
            onSelect={syncCol}
            onClick={syncCol}
            onFocus={(e) => {
              setFocused(true)
              syncCol(e)
            }}
            onBlur={() => setFocused(false)}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            className="w-full bg-transparent text-primary caret-transparent"
            aria-label="Terminal input"
          />
          {/* The caret rides in normal flow behind an invisible copy of the
              text to its left, so the browser measures its position instead of
              this component guessing at it. It shows only while focused,
              because a blinking cursor in a window you are not typing into is
              a lie. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center whitespace-pre"
          >
            <span className="invisible">{value.slice(0, col)}</span>
            {focused && <span className="term-caret" />}
          </span>
        </span>
      </div>
    </div>
  )
}

/**
 * The prompt, in parts. A real shell colours the user, the host and the path
 * differently, and reading `mudit@os /projects %` as one flat green string is
 * the tell that this is a costume.
 */
function Prompt({ cwd }: { cwd: string }) {
  return (
    <span aria-hidden="true">
      <span className="text-ok">mudit</span>
      <span className="text-tertiary">@</span>
      <span className="text-info">os</span>
      <span className="text-tertiary"> {cwd} </span>
      <span className="text-warn">%</span>{' '}
    </span>
  )
}

export default TerminalApp
