'use client'

import type { ReactNode } from 'react'

export function Key({
  children,
  onClick,
  title,
  active,
  disabled,
}: {
  children: ReactNode
  onClick: () => void
  title: string
  active?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      /* A word is its own accessible name; only the symbol keys need naming,
         and overriding "shuffle" with "new random array" made the two disagree. */
      aria-label={typeof children === 'string' && /[a-z]/i.test(children) ? undefined : title}
      aria-pressed={active}
      disabled={disabled}
      className="border border-wire px-1 text-xs text-dim transition-colors hover:border-live hover:text-live disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-wire disabled:hover:text-dim aria-pressed:border-live aria-pressed:text-live"
      style={{ height: 26 }}
    >
      {children}
    </button>
  )
}

export function Scrubber({
  at,
  length,
  onSeek,
  label,
}: {
  at: number
  length: number
  onSeek: (i: number) => void
  label: string
}) {
  return (
    <input
      type="range"
      min={0}
      max={Math.max(0, length - 1)}
      value={Math.max(0, at)}
      onChange={(e) => onSeek(Number(e.target.value))}
      aria-label={label}
      className="h-1 w-full appearance-none bg-wire accent-live"
      style={{ accentColor: 'var(--c-live)' }}
    />
  )
}

export function Rate({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <label className="flex items-center gap-1 text-xs text-dim">
      <span>rate</span>
      <input
        type="range"
        min={2}
        max={60}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="steps per second"
        className="h-1 appearance-none bg-wire"
        style={{ accentColor: 'var(--c-live)', width: 65 }}
      />
      <span className="tabular-nums" style={{ width: 39 }}>
        {value}/s
      </span>
    </label>
  )
}
