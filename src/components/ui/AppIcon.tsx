import { useId } from 'react'
import type { AppId } from '~/data'

/* ------------------------------------------------------------- app icons
 * Nine glyphs on one 64-unit grid, in three finishes.
 *
 * An application icon is not the interface glyph scaled up: the hairline marks
 * in `Glyph` are built to sit beside 12px text, and blown up to half an icon
 * they read as scratches. These are solid shapes in two weights of one ink,
 * which is what gives an icon a silhouette you can recognise at dock size.
 *
 * Nothing here holds state. The finish comes from `data-icons` on <html>, and
 * every colour is computed in CSS from the app's own L/C/H — so switching the
 * finish restyles every icon on the page without React re-rendering one. Hover
 * motion is CSS too, keyed off the link or button the icon sits in, which is
 * why this renders the same on the server and inside a window.
 */

/** Each app's hue in OKLCH. Pulled toward the wallpaper's cream and sage. */
const TONE: Record<AppId, { c: [number, number, number]; ink?: [number, number, number] }> = {
  projects: { c: [0.56, 0.085, 158] },
  failures: { c: [0.58, 0.14, 32] },
  skills: { c: [0.52, 0.11, 278] },
  experiments: { c: [0.68, 0.12, 78] },
  monitor: { c: [0.56, 0.075, 215] },
  about: { c: [0.53, 0.1, 315] },
  contact: { c: [0.57, 0.11, 248] },
  bin: { c: [0.56, 0.012, 80] },
  // A near-black tile in every finish but ink, where it gets the phosphor.
  terminal: { c: [0.34, 0.012, 250], ink: [0.78, 0.12, 150] },
}

/** The tile. A superellipse, not a rounded square: the curve runs the whole side. */
const SQ = 'M0 32C0 5.5 5.5 0 32 0S64 5.5 64 32 58.5 64 32 64 0 58.5 0 32Z'

const R = { strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const

/*
 * Class names on the glyph parts:
 *   p / s / k   primary ink, secondary ink, knockout (the tile colour, cut back in)
 *   sp / ss / sk the same three as strokes
 *   m-*         a moving part; its motion lives in globals.css under "app icons"
 */
const ART: Record<AppId, React.ReactNode> = {
  /* Layers of work. On hover they spread apart. */
  projects: (
    <>
      <rect className="s m-up2" x="20" y="15.5" width="24" height="6" rx="3" />
      <rect className="s m-up1" x="17.5" y="24" width="29" height="7" rx="3.5" />
      <rect className="p m-down" x="15" y="33.5" width="34" height="15" rx="4.5" />
    </>
  ),
  /* A fault. On hover it shakes. */
  failures: (
    <g className="m-shake">
      <path className="p sp" d="M32 17 L48.5 45 H15.5 Z" strokeWidth="5" strokeLinejoin="round" />
      <rect className="k" x="30" y="26" width="4" height="10.5" rx="2" />
      <circle className="k" cx="32" cy="40.8" r="2.3" />
    </g>
  ),
  /* A cut stone, lit on one facet. On hover it turns over. */
  skills: (
    <g className="m-turn">
      <path className="s ss" d="M32 15 L15 32 L32 49 Z" strokeWidth="3" strokeLinejoin="round" />
      <path className="p sp" d="M32 15 L49 32 L32 49 Z" strokeWidth="3" strokeLinejoin="round" />
    </g>
  ),
  /* A flask with something still in it. On hover it sloshes and bubbles. */
  experiments: (
    <>
      <path
        className="s m-slosh"
        d="M21.5 38.5 H42.5 L47.2 45.5 Q49 49.5 44.5 49.5 H19.5 Q15 49.5 16.8 45.5 Z"
      />
      <circle className="p m-bubble" cx="28" cy="45" r="1.7" />
      <circle className="p m-bubble" cx="34.5" cy="43" r="1.3" style={{ animationDelay: '0.35s' }} />
      <circle className="p m-bubble" cx="31" cy="46.5" r="1.5" style={{ animationDelay: '0.7s' }} />
      <path
        className="sp"
        d="M26.5 14.5 H37.5 M29 14.5 V27 L17 45.5 Q15 49.5 19.5 49.5 H44.5 Q49 49.5 47 45.5 L35 27 V14.5"
        strokeWidth="3.5"
        {...R}
      />
    </>
  ),
  /* A display reading a pulse. On hover the trace runs. */
  monitor: (
    <>
      <rect className="p" x="14" y="15" width="36" height="26" rx="5" />
      <rect className="s" x="30" y="40" width="4" height="6" />
      <rect className="s" x="24" y="45" width="16" height="3.5" rx="1.75" />
      <polyline
        className="sk m-trace"
        points="19,28.5 25,28.5 28,22.5 32,34.5 35,26 37.5,28.5 45,28.5"
        strokeWidth="2.8"
        strokeDasharray="48 48"
        {...R}
      />
    </>
  ),
  /* A person. On hover they look up and a ring goes out. */
  about: (
    <>
      <circle className="ss m-ring" cx="32" cy="32" r="22" fill="none" strokeWidth="2" />
      <path
        className="s"
        d="M16.5 48 C16.5 39 23.5 35 32 35 C40.5 35 47.5 39 47.5 48 Q47.5 49.5 46 49.5 H18 Q16.5 49.5 16.5 48Z"
      />
      <circle className="p m-nod" cx="32" cy="24.5" r="7.5" />
    </>
  ),
  /* An envelope. On hover the flap lifts and the letter rises out. */
  contact: (
    <>
      <g className="m-letter">
        <rect className="s" x="20" y="22" width="24" height="17" rx="2" />
        <rect className="k" x="24" y="25.5" width="11" height="2.2" rx="1.1" opacity="0.45" />
      </g>
      <rect className="p" x="14" y="21" width="36" height="26" rx="4.5" />
      <path className="sk m-flap" d="M16.5 24 L32 35 L47.5 24" strokeWidth="2.6" {...R} />
    </>
  ),
  /* A prompt and a cursor. On hover the prompt leans in and the cursor blinks. */
  terminal: (
    <>
      <rect className="p" x="13.5" y="16" width="37" height="32" rx="6" />
      <polyline className="sk m-prompt" points="21,26.5 26.5,32 21,37.5" strokeWidth="3.2" {...R} />
      <rect className="k m-blink" x="29.5" y="35.2" width="11" height="3.2" rx="1.6" />
    </>
  ),
  /* A bin. On hover the lid tips and something is thrown out. */
  bin: (
    <>
      <circle className="s m-toss" cx="36" cy="32" r="4.5" />
      <path className="p" d="M18.5 27 H45.5 L43 46.5 Q42.5 50 39 50 H25 Q21.5 50 21 46.5 Z" />
      <rect className="k" x="27.5" y="31.5" width="2.8" height="13" rx="1.4" />
      <rect className="k" x="33.7" y="31.5" width="2.8" height="13" rx="1.4" />
      <g className="m-lid">
        <rect className="p" x="15" y="19.5" width="34" height="4.5" rx="2.25" />
        <path className="sp" d="M27 19.5 V17.5 Q27 15.5 29 15.5 H35 Q37 15.5 37 17.5 V19.5" strokeWidth="2.6" {...R} />
      </g>
    </>
  ),
}

export function AppIcon({
  id,
  size = 40,
  fluid = false,
  className = '',
}: {
  id: AppId
  /** Edge length in px. Also scales the drop shadow, so an 18px icon is not smudged. */
  size?: number
  /** Fill the parent instead — for the dock, which sizes its slots itself. */
  fluid?: boolean
  className?: string
}) {
  // SVG gradients are referenced by id, and the same icon appears on the desk,
  // in the dock and in a title bar at once.
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const { c, ink } = TONE[id]

  return (
    <span
      data-app={id}
      className={`app-icon ${className}`}
      style={{
        width: fluid ? '100%' : size,
        height: fluid ? '100%' : size,
        ['--u' as string]: size / 60,
        ['--L' as string]: c[0],
        ['--C' as string]: c[1],
        ['--H' as string]: c[2],
        ...(ink && {
          ['--iL' as string]: ink[0],
          ['--iC' as string]: ink[1],
          ['--iH' as string]: ink[2],
        }),
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" width="100%" height="100%" focusable="false">
        <defs>
          <linearGradient id={`${uid}g`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className="ic-top" />
            <stop offset="1" className="ic-bot" />
          </linearGradient>
          <linearGradient id={`${uid}s`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.2" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${uid}r`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className="ic-rim" />
            <stop offset="0.55" className="ic-rim" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={SQ} fill={`url(#${uid}g)`} />
        <path className="ic-sheen" d={SQ} fill={`url(#${uid}s)`} />
        <path className="ic-edge" d={SQ} fill="none" strokeWidth="1" />
        <path d={SQ} fill="none" stroke={`url(#${uid}r)`} strokeWidth="1.4" transform="translate(0.8 0.8) scale(0.975)" />
        <g className="ic-art">{ART[id]}</g>
      </svg>
    </span>
  )
}
