'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { completions, run, type Line } from './engine'
import { useSystemApi } from '@/os/SystemProvider'
import { pathFor } from '@/os/routes'
import { profile } from '~/data'

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
  const [lines, setLines] = useState<Line[]>([
    { kind: 'note', text: 'MUDIT OS terminal — type `help`.' },
  ])
  const [value, setValue] = useState('')
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

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit(value)
      setValue('')
      return
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      const options = completions(value, cwd)
      if (options.length === 1) {
        const parts = value.split(/\s+/)
        parts[parts.length - 1] = options[0]
        setValue(parts.join(' '))
      } else if (options.length > 1) {
        setLines((prev) => [...prev, { kind: 'out', text: options.join('  ') }])
      }
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      cursor.current = Math.min(cursor.current + 1, history.current.length - 1)
      setValue(history.current[cursor.current] ?? '')
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      cursor.current = Math.max(cursor.current - 1, -1)
      setValue(cursor.current === -1 ? '' : (history.current[cursor.current] ?? ''))
    }
  }

  const prompt = `mudit@os ${cwd} %`

  return (
    <div
      className="h-full flex flex-col bg-window"
      onClick={() => input.current?.focus()}
    >
      <div ref={scroller} className="flex-1 overflow-auto p-4 mono text-[13px] term-col">
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
              {l.kind === 'in' ? <span className="text-ok">{prompt} </span> : null}
              {l.text || ' '}
            </p>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-subtle px-4 py-2 mono text-[13px]">
        <label htmlFor="term-input" className="text-ok shrink-0">
          {prompt}
        </label>
        <input
          id="term-input"
          ref={input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          className="flex-1 bg-transparent outline-none text-primary caret-ok"
          aria-label="Terminal input"
        />
      </div>
    </div>
  )
}

export default TerminalApp
