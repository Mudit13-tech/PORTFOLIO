'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { completions, run, type Line } from './engine'
import { useSystemApi } from '@/os/SystemProvider'
import { pathFor } from '@/os/routes'
import { buildVersion, meta, profile } from '~/data'
import { counts } from '@/lib/derived'
import { Glyph } from '@/components/ui'
import { DotNumber } from '@/components/ui/kit'

/**
 * The terminal.
 *
 * Tab completion, history and `clear` are non-negotiable — without them this is
 * a costume. Output is an ARIA live region so a screen reader announces
 * responses, and commands that open windows echo the path so the connection
 * between typing and the desktop is visible rather than magical.
 *
 * Each command and its output is drawn as one block on a dotted rail, so a long
 * session reads as a list of exchanges rather than a wall of text. `ls` output
 * is a row of tokens you can tap, and the chips above the prompt run the common
 * commands — on a phone, typing `cat /failures/ota-dev-bundle` is nobody's idea
 * of exploring.
 */
const QUICK = ['help', 'ls', 'whoami', 'stats', 'projects', 'failures', 'skills', 'contact', 'clear']

export function TerminalApp() {
  const api = useSystemApi()
  const [lines, setLines] = useState<Line[]>([])
  /** The welcome card. `clear` takes it away like everything else. */
  const [banner, setBanner] = useState(true)
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
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
  }, [lines])

  /**
   * Run one or more commands in order. The working directory is threaded
   * through the run rather than read back from state, so `cd` followed by `ls`
   * in one call lists the directory it just entered.
   */
  const execute = useCallback(
    (commands: string[]) => {
      let dir = cwd
      let cleared = false
      const added: Line[] = []

      for (const raw of commands) {
        const result = run(raw, dir)
        if (raw.trim()) history.current = [raw, ...history.current].slice(0, 50)

        if (result.clear) {
          cleared = true
          added.length = 0
        } else {
          added.push({ kind: 'in', text: raw, cwd: dir }, ...result.lines)
        }
        dir = result.cwd

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
        if (cmd === 'linkedin' && profile.links.linkedin) window.open(profile.links.linkedin, '_blank', 'noopener')
        if (cmd === 'resume') {
          const cv = profile.links.resume ?? profile.links.linkedin
          if (cv) window.open(cv, '_blank', 'noopener')
        }

        if (result.open) {
          api.open(result.open.id, result.open.payload)
          window.history.pushState(null, '', pathFor(result.open))
          if (raw.trim() === 'sudo hire-mudit') api.findEgg('hire')
        }
      }

      cursor.current = -1
      if (cleared) setBanner(false)
      setLines((prev) => (cleared ? added : [...prev, ...added]))
      setCwd(dir)
    },
    [api, cwd],
  )

  const submit = useCallback((raw: string) => execute([raw]), [execute])

  /** A tapped name from `ls`: enter a directory, read a file, open an app. */
  const openToken = useCallback(
    (name: string, dir: string | undefined) => {
      if (dir === undefined) {
        // A completion candidate: put it on the command line instead.
        const parts = value.split(/\s+/)
        parts[parts.length - 1] = name.replace(/\/$/, '')
        const next = parts.join(' ')
        setValue(next)
        setCol(next.length)
        input.current?.focus()
        return
      }
      const clean = name.replace(/\/$/, '')
      const abs = dir === '/' ? `/${clean}` : `${dir}/${clean}`
      if (name.endsWith('/')) execute([`cd ${abs}`, 'ls'])
      else if (dir === '/') submit(`open ${clean}`)
      else submit(`cat ${abs}`)
    },
    [execute, submit, value],
  )

  const syncCol = (e: React.SyntheticEvent<HTMLInputElement>) => {
    setCol(e.currentTarget.selectionStart ?? e.currentTarget.value.length)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
        setLines((prev) => [...prev, { kind: 'list', text: options.join('  ') }])
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

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submit(value)
    setValue('')
    setCol(0)
  }

  // A click on empty space puts you back on the command line — with a mouse.
  // On a touchscreen that would throw the keyboard up every time a token or
  // a chip is tapped, so touch leaves focus where it is.
  const onPointerUp = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    if ((e.target as HTMLElement).closest('button, a, input')) return
    if (!window.getSelection()?.isCollapsed) return
    input.current?.focus()
  }

  const blocks = group(lines)
  const prompt = `mudit@os ${cwd} %`

  return (
    <div className="terminal @container h-full flex flex-col" onPointerUp={onPointerUp}>
      <div ref={scroller} className="flex-1 overflow-auto overscroll-contain px-3 @lg:px-5 pt-3 @lg:pt-4 pb-3">
        <div role="log" aria-live="polite" aria-label="Terminal output" className="term-col mono text-[13px] leading-[1.65]">
          {banner && <Banner />}

          {blocks.map((b, i) => (
            <div key={i} className="term-block">
              {b.input && (
                <p className="text-primary break-words">
                  <Prompt cwd={b.input.cwd ?? '/'} />
                  {b.input.text || ' '}
                </p>
              )}
              {b.output.length > 0 && (
                <div className="term-out">
                  {b.output.map((l, j) =>
                    l.kind === 'list' ? (
                      <Tokens key={j} line={l} onPick={openToken} />
                    ) : (
                      <p
                        key={j}
                        className={`whitespace-pre-wrap break-words ${
                          l.kind === 'err' ? 'text-error' : l.kind === 'note' ? 'text-tertiary' : 'text-secondary'
                        }`}
                      >
                        {l.text || ' '}
                      </p>
                    ),
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="term-dock shrink-0 px-3 @lg:px-5 pt-1">
        <div className="term-chips" role="toolbar" aria-label="Common commands">
          {QUICK.map((c) => (
            <button key={c} type="button" className="term-chip" onClick={() => submit(c)}>
              {c}
            </button>
          ))}
        </div>

        <form className="term-rail mono" onSubmit={onSubmit}>
          <label htmlFor="term-input" className="shrink-0">
            <span className="sr-only">{prompt}</span>
            <Prompt cwd={cwd} compact />
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
              autoCorrect="off"
              enterKeyHint="go"
              placeholder={focused ? '' : 'type a command'}
              className="w-full bg-transparent text-primary caret-transparent placeholder:text-tertiary/70"
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
          <button type="submit" className="term-send" aria-label="Run command" data-idle={!value.trim() || undefined}>
            <Glyph name="enter" size={15} strokeWidth={1.75} />
          </button>
        </form>
      </div>
    </div>
  )
}

/** The session's opening card, built from the same data the windows render. */
function Banner() {
  const stats: [number, string][] = [
    [counts.projects, 'projects'],
    [counts.failures, 'crash reports'],
    [counts.skills, 'modules'],
  ]
  return (
    <section className="term-banner mb-4" aria-label="Session">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-primary">
          <span className="w-2 h-2 rounded-full bg-ok" aria-hidden="true" />
          {meta.systemName}
        </span>
        <span className="term-tag">build {buildVersion}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3">
        {stats.map(([n, label]) => (
          <div key={label} className="term-stat">
            <DotNumber value={String(n).padStart(2, '0')} size={18} className="text-primary" />
            <span className="block text-[11px] text-tertiary mt-2 truncate">{label}</span>
          </div>
        ))}
      </div>
      <p className="text-tertiary mt-3 text-[12px]">
        type <span className="text-ok">help</span> for commands, <span className="text-ok">ls</span> to look
        around — or tap a command below.
      </p>
    </section>
  )
}

/** `ls` output as tokens: directories enter, files open. */
function Tokens({ line, onPick }: { line: Line; onPick: (name: string, dir: string | undefined) => void }) {
  const names = line.text.split(/\s{2,}/).filter(Boolean)
  return (
    <div className="flex flex-wrap gap-1.5 py-1">
      {names.map((n) => {
        const dir = n.endsWith('/')
        return (
          <button
            key={n}
            type="button"
            onClick={() => onPick(n, line.dir)}
            className={`term-token ${dir ? 'is-dir' : ''}`}
          >
            <Glyph name={dir ? 'folder' : 'chevron'} size={11} />
            {n}
          </button>
        )
      })}
    </div>
  )
}

/** Consecutive lines, grouped under the command that produced them. */
function group(lines: Line[]): { input: Line | null; output: Line[] }[] {
  const out: { input: Line | null; output: Line[] }[] = []
  for (const l of lines) {
    if (l.kind === 'in' || out.length === 0) out.push({ input: l.kind === 'in' ? l : null, output: [] })
    if (l.kind !== 'in') out[out.length - 1].output.push(l)
  }
  return out
}

/**
 * The prompt, in parts. A real shell colours the user, the host and the path
 * differently, and reading `mudit@os /projects %` as one flat green string is
 * the tell that this is a costume. In a narrow window the user@host is
 * dropped from the live prompt; the path is the part that changes.
 */
function Prompt({ cwd, compact = false }: { cwd: string; compact?: boolean }) {
  return (
    <span aria-hidden="true">
      <span className={compact ? 'hidden @md:inline' : ''}>
        <span className="text-ok">mudit</span>
        <span className="text-tertiary">@</span>
        <span className="text-info">os</span>{' '}
      </span>
      <span className="term-cwd">{cwd}</span>
      <span className="text-warn"> %</span>{' '}
    </span>
  )
}

export default TerminalApp
