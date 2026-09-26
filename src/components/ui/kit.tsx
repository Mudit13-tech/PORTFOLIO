import { useId } from 'react'
import { Glyph } from './index'

/**
 * The interior kit: the material every application's content is built from.
 *
 * Soft frosted cards lit from two corners in the app's own hue, a dot-matrix
 * face for the numbers worth reading from across the room, and dotted tracks
 * for anything that is a fraction of something. Like the primitives in
 * `index.tsx`, none of this is a client component — the same markup renders
 * in the crawler's document, in a window and in a phone sheet.
 *
 * Layout inside an application answers to the width of the window it is in,
 * not the width of the screen, so everything responsive here uses container
 * queries (`@md:`), and the window body, the phone sheet and the plain
 * document are each declared a container.
 */

/* ------------------------------------------------------------------ page */

export function AppPage({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`app-page px-4 pt-4 @lg:px-6 @lg:pt-5 ${className}`}>{children}</div>
}

/**
 * The top of every application. The path stays in mono because it is the
 * system talking; the title is for people.
 */
export function AppHeader({
  path,
  title,
  sub,
  aside,
}: {
  path: string
  title: string
  sub?: React.ReactNode
  aside?: React.ReactNode
}) {
  return (
    <header className="flex items-start justify-between gap-3 mb-4">
      <div className="min-w-0">
        <p className="field-label">{path}</p>
        <h1 className="text-[22px] @lg:text-[26px] leading-[1.15] tracking-[-0.02em] font-medium text-primary mt-1">
          {title}
        </h1>
        {sub ? <p className="text-[13px] text-tertiary mt-1">{sub}</p> : null}
      </div>
      {aside ? <div className="shrink-0 flex items-center gap-2 pt-0.5">{aside}</div> : null}
    </header>
  )
}

/* ------------------------------------------------------------------- orb
 * The card. Tone picks the two lights; `as` lets a whole card be a link.
 */
export type Tone = 'ok' | 'warn' | 'error' | 'info' | 'violet' | 'neutral' | 'teal'

export function Orb({
  tone = 'neutral',
  className = '',
  href,
  external,
  children,
  label,
}: {
  tone?: Tone
  className?: string
  href?: string
  external?: boolean
  children: React.ReactNode
  label?: string
}) {
  const cls = `orb tone-${tone} ${href ? 'orb-link' : ''} ${className}`
  if (href) {
    return (
      <a
        href={href}
        className={cls}
        aria-label={label}
        {...(external ? { target: '_blank', rel: 'noreferrer noopener', 'data-native': 'true' } : {})}
      >
        {children}
      </a>
    )
  }
  return <section className={cls}>{children}</section>
}

/** The recessed panel inside a card — "Part № · · · Total cost". */
export function Inset({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`inset-panel ${className}`}>{children}</div>
}

/** A label over a value, the unit of every inset panel. */
export function Stat({
  label,
  children,
  align = 'left',
}: {
  label: string
  children: React.ReactNode
  align?: 'left' | 'right'
}) {
  return (
    <div className={`min-w-0 ${align === 'right' ? 'text-right' : ''}`}>
      <p className="text-[11.5px] text-tertiary leading-none">{label}</p>
      <div className={`mt-1.5 flex items-end gap-1 ${align === 'right' ? 'justify-end' : ''}`}>{children}</div>
    </div>
  )
}

/** The short bar between two stats: a dash on a hairline. */
export function Dash() {
  return (
    <span className="dash-mark hidden @xs:block" aria-hidden="true">
      <span />
    </span>
  )
}

/* ------------------------------------------------------------------ pills */

export function Pill({
  children,
  tone,
  className = '',
}: {
  children: React.ReactNode
  tone?: Tone
  className?: string
}) {
  return <span className={`pill ${tone ? `pill-${tone}` : ''} ${className}`}>{children}</span>
}

/** The round arrow in a card's corner. Decorative when the card is the link. */
export function ArrowDot({ size = 34, glyph = 'external' }: { size?: number; glyph?: 'external' | 'chevron' }) {
  return (
    <span className="arrow-dot" style={{ width: size, height: size }} aria-hidden="true">
      <Glyph name={glyph} size={Math.round(size * 0.4)} />
    </span>
  )
}

/** A round link button — Source, Live, GitHub. */
export function RoundLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer noopener" data-native="true" className="round-link">
      {children}
      <Glyph name="external" size={12} />
    </a>
  )
}

/* ------------------------------------------------------------ dot matrix
 * A 5×7 LED face for the handful of numbers that deserve it. Each glyph is a
 * bitmap, drawn as dots, so it is crisp at any size and needs no font file.
 * Anything it cannot draw falls back to ordinary mono text rather than
 * guessing at a shape.
 */
const FACE: Record<string, string[]> = {
  '0': ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  '%': ['11000', '11001', '00010', '00100', '01000', '10011', '00011'],
  $: ['00100', '01111', '10100', '01110', '00101', '11110', '00100'],
  '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '/': ['00001', '00001', '00010', '00100', '01000', '10000', '10000'],
  k: ['10000', '10000', '10010', '10100', '11000', '10100', '10010'],
  h: ['10000', '10000', '10110', '11001', '10001', '10001', '10001'],
  d: ['00001', '00001', '01101', '10011', '10001', '10011', '01101'],
  x: ['00000', '00000', '10001', '01010', '00100', '01010', '10001'],
  '.': ['0', '0', '0', '0', '0', '0', '1'],
  ',': ['0', '0', '0', '0', '0', '1', '1'],
  ':': ['0', '0', '1', '0', '0', '1', '0'],
  ' ': ['00', '00', '00', '00', '00', '00', '00'],
}

export function canDot(value: string): boolean {
  return value.length > 0 && [...value].every((c) => c in FACE)
}

export function DotNumber({
  value,
  size = 28,
  className = '',
  dim = false,
}: {
  value: string | number
  /** Cap height in pixels. */
  size?: number
  className?: string
  /** Draw the unlit dots too, faintly — the look of a real panel. */
  dim?: boolean
}) {
  const text = String(value)
  if (!canDot(text)) return <span className={`mono ${className}`}>{text}</span>

  const pitch = size / 7
  const r = pitch * 0.34
  const gap = pitch * 1.1
  const lit: React.ReactNode[] = []
  const off: React.ReactNode[] = []
  let x = 0
  for (const [ci, ch] of [...text].entries()) {
    const rows = FACE[ch]
    const cols = rows[0].length
    rows.forEach((row, ry) => {
      for (let cx = 0; cx < cols; cx++) {
        const cxp = x + cx * pitch + pitch / 2
        const cyp = ry * pitch + pitch / 2
        if (row[cx] === '1') lit.push(<circle key={`${ci}-${ry}-${cx}`} cx={cxp} cy={cyp} r={r} />)
        else if (dim && ch !== ' ') off.push(<circle key={`${ci}-${ry}-${cx}`} cx={cxp} cy={cyp} r={r * 0.8} />)
      }
    })
    x += cols * pitch + gap
  }
  const width = Math.max(0, x - gap)

  return (
    <svg
      role="img"
      aria-label={text}
      width={width}
      height={size}
      viewBox={`0 0 ${width} ${size}`}
      className={`dot-number shrink-0 ${className}`}
    >
      {dim && <g className="dot-off">{off}</g>}
      <g fill="currentColor">{lit}</g>
    </svg>
  )
}

/**
 * A measured value: the number in dots, the unit beside it in plain type —
 * "25.9 MB" becomes a dot-matrix 25.9 and a small "MB". A value with no
 * leading number ("render.com") is simply text.
 */
export function Figure({ value, size = 20 }: { value: string; size?: number }) {
  const m = /^([\d][\d.,:%$+\-/]*)\s*(.*)$/.exec(value)
  if (!m || !canDot(m[1]) || m[2].length > 20 || /\d/.test(m[2]))
    return <span className="text-[15px] text-primary">{value}</span>
  return (
    <span className="inline-flex items-end gap-1.5 text-primary">
      <DotNumber value={m[1]} size={size} />
      {m[2] && <span className="text-[12px] text-secondary leading-none">{m[2]}</span>}
    </span>
  )
}

/* ------------------------------------------------------------------ track
 * A fraction, drawn as a slider: a filled run, a marker where it ends, and a
 * row of dotted ticks underneath. Presentation only — the number it draws is
 * always printed next to it.
 */
export function Track({
  value,
  labels,
  tone = 'ok',
}: {
  /** 0 to 1. */
  value: number
  labels?: string[]
  tone?: Tone
}) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 1000) / 10
  return (
    <div className={`track tone-${tone}`} aria-hidden="true">
      <div className="track-line">
        <span className="track-fill" style={{ width: `${pct}%` }} />
        <span className="track-marker" style={{ left: `${pct}%` }} />
      </div>
      <div className="track-ticks" />
      {labels && labels.length > 0 && (
        <div className="flex justify-between mt-1.5">
          {labels.map((l) => (
            <span key={l} className="text-[11.5px] text-tertiary tabular-nums">
              {l}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/** Frequency as four lamps — filled for each project that uses it. */
export function Lamps({ n, of = 4 }: { n: number; of?: number }) {
  return (
    <span className="inline-flex items-center gap-1 shrink-0">
      {Array.from({ length: of }, (_, i) => (
        <span key={i} aria-hidden="true" className={`lamp ${i < n ? 'lamp-on' : ''}`} />
      ))}
      <span className="sr-only">
        frequency {n} of {of}
      </span>
    </span>
  )
}

/* ----------------------------------------------------------------- filter
 * Segmented tabs that filter a list with no JavaScript at all: the tabs are
 * radio buttons, the list items carry `data-f`, and one generated rule per
 * option hides whatever does not match. It works in the crawler's document,
 * in a window before its code has loaded, and with scripting switched off.
 *
 * The rules are scoped by `useId`, so two copies of the same list — the plain
 * document and a window — never filter each other.
 */
export function Filter({
  label,
  options,
  children,
}: {
  label: string
  options: { value: string; label: string; count?: number }[]
  children: React.ReactNode
}) {
  const id = useId()
  const scope = `[data-filter="${id}"]`
  const css = options
    .map(
      (o) =>
        `${scope}:has(input[value="${o.value}"]:checked) [data-f]:not([data-f~="${o.value}"]){display:none}`,
    )
    .join('')

  return (
    <div data-filter={id}>
      <style>{css}</style>
      <div role="radiogroup" aria-label={label} className="segmented mb-3">
        <label className="seg">
          <input type="radio" name={id} value="*" defaultChecked className="sr-only" />
          <span>All</span>
        </label>
        {options.map((o) => (
          <label key={o.value} className="seg">
            <input type="radio" name={id} value={o.value} className="sr-only" />
            <span>
              {o.label}
              {o.count !== undefined && <span className="seg-count">{o.count}</span>}
            </span>
          </label>
        ))}
      </div>
      {children}
    </div>
  )
}
