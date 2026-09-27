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
  | 'sound'
  | 'mute'
  | 'enter'
  | 'arrow'
  | 'copy'
  | 'layers'
  | 'target'
  | 'code'
  | 'spark'
  | 'commit'
  | 'clock'
  | 'lock'
  | 'unlock'
  | 'signal'
  | 'quote'
  | 'flag'
  | 'globe'
  | 'device'
  | 'radio'
  | 'file'
  | 'wrench'

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
  /* A driver and one wave. Two waves at 16px close up into a smudge. */
  enter: (
    <>
      <path d="M12.5 3.5v4.75a2 2 0 0 1-2 2h-7" />
      <path d="m6 7.25-3 3 3 3" />
    </>
  ),
  sound: (
    <>
      <path d="M8.5 2.75 4.75 5.75H2.5v4.5h2.25l3.75 3V2.75Z" />
      <path d="M11.25 6a2.75 2.75 0 0 1 0 4" />
    </>
  ),
  mute: (
    <>
      <path d="M8.5 2.75 4.75 5.75H2.5v4.5h2.25l3.75 3V2.75Z" />
      <path d="m11 6.25 3 3.5M14 6.25l-3 3.5" />
    </>
  ),
  arrow: (
    <>
      <path d="M3 8h9.5" />
      <path d="m9 4.5 3.5 3.5L9 11.5" />
    </>
  ),
  copy: (
    <>
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.75" />
      <path d="M10.5 3.2A1.5 1.5 0 0 0 9.25 2.5h-5A1.75 1.75 0 0 0 2.5 4.25v5a1.5 1.5 0 0 0 .7 1.25" />
    </>
  ),
  /* Two sheets of a stack, the top one lifted. */
  layers: (
    <>
      <path d="M8 2.5 13.75 5.5 8 8.5 2.25 5.5 8 2.5Z" />
      <path d="m2.25 8.25 5.75 3 5.75-3" />
      <path d="m2.25 11 5.75 3 5.75-3" />
    </>
  ),
  target: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <circle cx="8" cy="8" r="2.5" />
      <path d="M8 8h.01" />
    </>
  ),
  code: (
    <>
      <path d="m5.5 4.5-3.25 3.5 3.25 3.5" />
      <path d="m10.5 4.5 3.25 3.5-3.25 3.5" />
    </>
  ),
  /* Four points, concave sides: the mark for a thought, not a rating. */
  spark: (
    <path d="M8 2.25c.45 3.05 2.7 5.3 5.75 5.75-3.05.45-5.3 2.7-5.75 5.75-.45-3.05-2.7-5.3-5.75-5.75C5.3 7.55 7.55 5.3 8 2.25Z" />
  ),
  commit: (
    <>
      <circle cx="8" cy="8" r="2.5" />
      <path d="M1.75 8h3.75M10.5 8h3.75" />
    </>
  ),
  clock: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 5v3.25l2.1 1.35" />
    </>
  ),
  lock: (
    <>
      <rect x="3.25" y="7" width="9.5" height="6.75" rx="1.75" />
      <path d="M5.5 7V5.25a2.5 2.5 0 0 1 5 0V7" />
    </>
  ),
  unlock: (
    <>
      <rect x="3.25" y="7" width="9.5" height="6.75" rx="1.75" />
      <path d="M5.5 7V5.25a2.5 2.5 0 0 1 4.85-.85" />
    </>
  ),
  /* Four bars, rising — used as a readout, so every bar is drawn. */
  signal: (
    <>
      <path d="M3 13v-1.5" />
      <path d="M6.33 13V9.5" />
      <path d="M9.67 13V7" />
      <path d="M13 13V4" />
    </>
  ),
  quote: (
    <>
      <path d="M3 10.5c0-3 1.25-4.75 3.5-5.5" />
      <path d="M3 10.25a1.75 1.75 0 1 0 3.5 0 1.75 1.75 0 0 0-3.5 0Z" />
      <path d="M9.5 10.5c0-3 1.25-4.75 3.5-5.5" />
      <path d="M9.5 10.25a1.75 1.75 0 1 0 3.5 0 1.75 1.75 0 0 0-3.5 0Z" />
    </>
  ),
  flag: (
    <>
      <path d="M3.5 13.75V2.75" />
      <path d="M3.5 3h8.25L10 5.75l1.75 2.75H3.5" />
    </>
  ),
  globe: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M2.5 8h11" />
      <path d="M8 2.5c1.6 1.6 2.4 3.4 2.4 5.5S9.6 11.9 8 13.5C6.4 11.9 5.6 10.1 5.6 8S6.4 4.1 8 2.5Z" />
    </>
  ),
  device: (
    <>
      <rect x="4.5" y="2" width="7" height="12" rx="1.75" />
      <path d="M7.25 11.75h1.5" />
    </>
  ),
  /* A mast and two arcs of signal: a channel, which is not the same as a letter. */
  radio: (
    <>
      <path d="M8 8.5v5" />
      <circle cx="8" cy="7" r="1.25" />
      <path d="M5.2 4.4a3.9 3.9 0 0 0 0 5.2M10.8 4.4a3.9 3.9 0 0 1 0 5.2" />
      <path d="M3.2 2.6a6.6 6.6 0 0 0 0 8.8M12.8 2.6a6.6 6.6 0 0 1 0 8.8" />
    </>
  ),
  file: (
    <>
      <path d="M9.25 2.5H4.75a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h6.5a1 1 0 0 0 1-1V5.5l-3-3Z" />
      <path d="M9.25 2.5v3h3" />
      <path d="M6 9h4M6 11h2.5" />
    </>
  ),
  wrench: (
    <path d="M10.4 2.6a3.25 3.25 0 0 0-3.9 4.2L2.8 10.5a1.3 1.3 0 0 0 0 1.85l.85.85a1.3 1.3 0 0 0 1.85 0l3.7-3.7a3.25 3.25 0 0 0 4.2-3.9l-1.95 1.95-1.9-.3-.3-1.9 1.95-1.95Z" />
  ),
}

/* ---------------------------------------------------------------- brands
 * The three services a visitor might reach me on, drawn as their own marks
 * rather than as three identical envelopes. Filled, on a 24-unit grid, from
 * Simple Icons (CC0) — a brand is recognised by its silhouette, and a
 * silhouette redrawn by hand is a silhouette slightly wrong.
 */
export type BrandName = 'github' | 'leetcode' | 'linkedin'

const BRANDS: Record<BrandName, string> = {
  github:
    'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
  leetcode:
    'M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z',
  linkedin:
    'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
}

export function Brand({ name, size = 16, className = '' }: { name: BrandName; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d={BRANDS[name]} />
    </svg>
  )
}

export { AppIcon } from './AppIcon'
export { AppIcon3D, IconFramesProvider } from './AppIcon3D'

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
const FAILURE_TONE: Record<FailureStatus, { tone: 'ok' | 'warn' | 'error' | 'neutral'; label: string; glyph: GlyphName }> = {
  failed: { tone: 'error', label: 'failed', glyph: 'warn' },
  broken: { tone: 'error', label: 'broken', glyph: 'warn' },
  'data-loss': { tone: 'error', label: 'data loss', glyph: 'warn' },
  abandoned: { tone: 'warn', label: 'abandoned', glyph: 'warn' },
  'never-shipped': { tone: 'warn', label: 'never shipped', glyph: 'warn' },
}

const PROJECT_TONE: Record<ProjectStatus, { tone: 'ok' | 'warn' | 'error' | 'neutral'; label: string; glyph: GlyphName }> = {
  shipped: { tone: 'ok', label: 'shipped', glyph: 'check' },
  wip: { tone: 'warn', label: 'in progress', glyph: 'chevron' },
  archived: { tone: 'neutral', label: 'archived', glyph: 'bin' },
}

export function StatusTag({ status }: { status: FailureStatus | ProjectStatus }) {
  const map = (status in FAILURE_TONE ? FAILURE_TONE : PROJECT_TONE) as Record<
    string,
    { tone: string; label: string; glyph: GlyphName }
  >
  const s = map[status]
  if (!s) return null
  return (
    <span className={`pill ${s.tone === 'neutral' ? '' : `pill-${s.tone}`}`}>
      <Glyph name={s.glyph} size={11} />
      {s.label}
    </span>
  )
}

export function SeverityTag({ level }: { level: Severity }) {
  const tone = level === 'high' ? 'bg-error' : level === 'medium' ? 'bg-warn' : 'bg-tertiary'
  return (
    <span className="pill">
      <span className={`w-1.5 h-1.5 rounded-full ${tone}`} aria-hidden="true" />
      {level} severity
    </span>
  )
}

/* ---------------------------------------------------------------- layout
 * These answer to their container, not the screen: a field stacks its label
 * over its value in a narrow window and sits beside it in a wide one.
 */

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
    <div className="grid grid-cols-1 @sm:grid-cols-[minmax(7.5rem,auto)_1fr] gap-x-4 gap-y-0.5 items-baseline">
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
      <h2 className="field-label section-title mb-2.5">{title}</h2>
      <div className="prose-col text-[15px] leading-[1.65] text-secondary">{children}</div>
    </section>
  )
}

export function Rule() {
  return <hr className="my-6 border-0 border-t border-subtle/70" />
}

export function Mono({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={`mono ${className}`}>{children}</span>
}

export function Chip({ children }: { children: React.ReactNode }) {
  return <span className="pill mono text-[12px]">{children}</span>
}

export function Meter({ value, max, tone = 'bg-ok' }: { value: number; max: number; tone?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="h-1.5 w-full rounded-full bg-raised overflow-hidden" aria-hidden="true">
      <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

/**
 * The honest empty state. A field with nothing in it says so, in the system's
 * own voice, rather than rendering a placeholder that pretends to be content.
 */
export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block mono text-[12px] text-tertiary border border-dashed border-strong/70 px-2.5 py-1 rounded-full">
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
    <p className="mono text-[12px] text-warn border border-warn/35 bg-warn/8 rounded-2xl px-3 py-2">
      Drafted from commit history — not yet confirmed by the author. The commit
      cited below is real; the account of it is reconstructed.
    </p>
  )
}
