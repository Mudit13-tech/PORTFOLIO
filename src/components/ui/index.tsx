import type { FailureStatus, ProjectStatus, Severity } from '~/data'

/**
 * Shared primitives.
 *
 * None of these is a client component. They render identically on the server
 * (for the no-JS document and the crawler) and inside a window, which is what
 * lets one implementation serve all three shells.
 */

/* --------------------------------------------------------------- glyphs
 * A single geometric family at 1.5px stroke. No emoji anywhere in this system:
 * emoji renders differently on every platform, breaks the visual language
 * instantly, and is the fastest way to make a careful interface look unfinished.
 */
export type GlyphName =
  | 'projects'
  | 'failures'
  | 'skills'
  | 'experiments'
  | 'monitor'
  | 'about'
  | 'contact'
  | 'terminal'
  | 'bin'
  | 'chevron'
  | 'external'
  | 'close'
  | 'minimize'
  | 'maximize'
  | 'warn'
  | 'check'
  | 'search'
  | 'theme'
  | 'pulse'
  | 'grid'
  | 'power'
  | 'folder'
  | 'caret'

const PATHS: Record<GlyphName, React.ReactNode> = {
  projects: <rect x="2.75" y="2.75" width="10.5" height="10.5" rx="1" />,
  failures: (
    <>
      <path d="M8 2.5 14 13.5H2L8 2.5Z" />
      <path d="M8 6.75v3" />
      <path d="M8 11.75h.01" />
    </>
  ),
  skills: <path d="M8 2.5 13.5 8 8 13.5 2.5 8 8 2.5Z" />,
  experiments: <path d="M8 2.2 13.6 5.4v5.2L8 13.8 2.4 10.6V5.4L8 2.2Z" />,
  monitor: (
    <>
      <rect x="2.5" y="3.5" width="11" height="8" rx="1" />
      <path d="M6 13.5h4" />
    </>
  ),
  about: (
    <>
      <circle cx="8" cy="6" r="2.4" />
      <path d="M3.4 13.2a4.8 4.8 0 0 1 9.2 0" />
    </>
  ),
  contact: (
    <>
      <rect x="2.5" y="3.75" width="11" height="8.5" rx="1" />
      <path d="m2.9 4.4 5.1 4 5.1-4" />
    </>
  ),
  terminal: (
    <>
      <path d="m3.5 5.5 3 2.5-3 2.5" />
      <path d="M8.5 11h4" />
    </>
  ),
  bin: (
    <>
      <path d="M3.5 4.5h9" />
      <path d="M5.5 4.5V3.2h5v1.3" />
      <path d="M4.6 4.5 5.3 13h5.4l.7-8.5" />
    </>
  ),
  chevron: <path d="m6.5 4 4 4-4 4" />,
  external: (
    <>
      <path d="M9 3.5h3.5V7" />
      <path d="M12.5 3.5 7 9" />
      <path d="M11.5 9.5v3h-8v-8h3" />
    </>
  ),
  close: <path d="m4.5 4.5 7 7M11.5 4.5l-7 7" />,
  minimize: <path d="M4 8h8" />,
  maximize: <rect x="4" y="4" width="8" height="8" rx="0.5" />,
  warn: (
    <>
      <path d="M8 2.5 14 13.5H2L8 2.5Z" />
      <path d="M8 6.75v3" />
      <path d="M8 11.75h.01" />
    </>
  ),
  check: <path d="m3.5 8.5 3 3 6-7" />,
  search: (
    <>
      <circle cx="7.25" cy="7.25" r="4.25" />
      <path d="m10.5 10.5 3 3" />
    </>
  ),
  /* Half-filled disc: the same mark in both themes, rotated by what it means. */
  theme: (
    <>
      <circle cx="8" cy="8" r="5.25" />
      <path d="M8 2.75v10.5" />
      <path d="M8 4.5a3.5 3.5 0 0 1 0 7" fill="currentColor" stroke="none" />
    </>
  ),
  pulse: <path d="M1.5 8h3l1.75-4 2.5 8L10.75 8h3.75" />,
  grid: (
    <>
      <rect x="2.5" y="2.5" width="4.5" height="4.5" rx="1" />
      <rect x="9" y="2.5" width="4.5" height="4.5" rx="1" />
      <rect x="2.5" y="9" width="4.5" height="4.5" rx="1" />
      <rect x="9" y="9" width="4.5" height="4.5" rx="1" />
    </>
  ),
  power: (
    <>
      <path d="M8 2.5v5" />
      <path d="M12.1 4.6a5.5 5.5 0 1 1-8.2 0" />
    </>
  ),
  folder: (
    <>
      <path d="M2.5 12.5v-8a1 1 0 0 1 1-1h3l1.5 1.75h4.5a1 1 0 0 1 1 1V12.5a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1Z" />
    </>
  ),
  caret: <path d="m4 6.5 4 4 4-4" />,
}

export { AppIcon } from './AppIcon'

export function Glyph({
  name,
  className = '',
  size = 16,
  strokeWidth = 1.5,
}: {
  name: GlyphName
  className?: string
  size?: number
  strokeWidth?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS[name]}
    </svg>
  )
}

/* --------------------------------------------------------------- status
 * Status is never communicated by colour alone: every tag carries the colour,
 * the word, and a glyph. That is the difference between a design that passes a
 * contrast audit and one that a colour-blind reader can actually use.
 */
const FAILURE_TONE: Record<FailureStatus, { tone: string; label: string; glyph: GlyphName }> = {
  failed: { tone: 'text-error', label: 'failed', glyph: 'warn' },
  broken: { tone: 'text-error', label: 'broken', glyph: 'warn' },
  'data-loss': { tone: 'text-error', label: 'data loss', glyph: 'warn' },
  abandoned: { tone: 'text-warn', label: 'abandoned', glyph: 'warn' },
  'never-shipped': { tone: 'text-warn', label: 'never shipped', glyph: 'warn' },
}

const PROJECT_TONE: Record<ProjectStatus, { tone: string; label: string; glyph: GlyphName }> = {
  shipped: { tone: 'text-ok', label: 'shipped', glyph: 'check' },
  wip: { tone: 'text-warn', label: 'in progress', glyph: 'chevron' },
  archived: { tone: 'text-tertiary', label: 'archived', glyph: 'bin' },
}

export function StatusTag({ status }: { status: FailureStatus | ProjectStatus }) {
  const map = (status in FAILURE_TONE ? FAILURE_TONE : PROJECT_TONE) as Record<
    string,
    { tone: string; label: string; glyph: GlyphName }
  >
  const s = map[status]
  if (!s) return null
  return (
    <span className={`inline-flex items-center gap-1 micro uppercase ${s.tone}`}>
      <Glyph name={s.glyph} size={11} />
      {s.label}
    </span>
  )
}

export function SeverityTag({ level }: { level: Severity }) {
  const tone = level === 'high' ? 'text-error' : level === 'medium' ? 'text-warn' : 'text-tertiary'
  return <span className={`micro uppercase ${tone}`}>{level} severity</span>
}

/* ---------------------------------------------------------------- layout */

export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="grid grid-cols-[minmax(7.5rem,auto)_1fr] gap-x-4 gap-y-1 items-baseline">
      <dt className="field-label">{label}</dt>
      <dd className="text-[15px] text-primary">
        {children}
        {hint ? <span className="block micro text-tertiary mt-0.5">{hint}</span> : null}
      </dd>
    </div>
  )
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7 first:mt-0">
      <h2 className="field-label mb-2">{title}</h2>
      <div className="prose-col text-[15px] leading-[1.6] text-secondary">{children}</div>
    </section>
  )
}

export function Rule() {
  return <hr className="my-6 border-0 border-t border-subtle" />
}

export function Mono({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={`mono ${className}`}>{children}</span>
}

export function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="mono text-[12px] px-1.5 py-0.5 rounded-sm bg-raised text-secondary border border-subtle">
      {children}
    </span>
  )
}

export function Meter({ value, max, tone = 'bg-ok' }: { value: number; max: number; tone?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="h-1.5 w-full rounded-sm bg-raised overflow-hidden" aria-hidden="true">
      <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

/**
 * The honest empty state. A field with nothing in it says so, in the system's
 * own voice, rather than rendering a placeholder that pretends to be content.
 */
export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <span className="mono text-[12px] text-tertiary border border-dashed border-subtle px-1.5 py-0.5 rounded-sm">
      {children}
    </span>
  )
}

export function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      data-native="true"
      className="inline-flex items-center gap-1 text-info hover:text-primary underline underline-offset-2 decoration-subtle"
    >
      {children}
      <Glyph name="external" size={12} />
    </a>
  )
}

/** A draft marker. Shown on any crash report Mudit has not yet confirmed. */
export function DraftNotice() {
  return (
    <p className="mono text-[12px] text-warn border border-warn/40 bg-warn/5 rounded-sm px-2 py-1.5">
      Drafted from commit history — not yet confirmed by the author. The commit
      cited below is real; the account of it is reconstructed.
    </p>
  )
}
