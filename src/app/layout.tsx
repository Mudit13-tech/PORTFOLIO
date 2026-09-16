import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import { profile } from '~/content/profile'
import './globals.css'

/* One typeface. All hierarchy comes from size, weight and tracking. */
const mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains',
  weight: ['400', '500', '700'],
})

const description =
  profile.summary ??
  `${profile.discipline} at ${profile.institution}. A keyboard-driven workspace over a year of real contribution and problem-solving data.`

export const metadata: Metadata = {
  title: { default: `${profile.name} · workspace`, template: `%s · ${profile.name}` },
  description,
  applicationName: 'ics workspace',
  authors: [{ name: profile.name }],
  openGraph: {
    title: `${profile.name} · workspace`,
    description,
    type: 'profile',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#07090A' },
    { media: '(prefers-color-scheme: light)', color: '#F2F0E9' },
  ],
}

/**
 * Stamped before first paint so the theme, the cold start and the first-visit
 * hint are all settled by the time anything renders. Nothing here can flash,
 * and none of it shifts layout.
 */
const PREFLIGHT = `(function(){try{var d=document.documentElement,s=localStorage;
var t=s.getItem('ics:theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}
d.dataset.theme=t;
var quiet=matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!s.getItem('ics:booted')&&!quiet){d.dataset.boot='1'}
if(!s.getItem('ics:hinted')){d.dataset.hint='1'}}catch(e){document.documentElement.dataset.theme='dark'}})()`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={mono.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFLIGHT }} />
      </head>
      <body>
        <a
          href="#workspace"
          className="sr-only focus:not-sr-only focus:absolute focus:left-1 focus:top-1 focus:z-50 focus:border focus:border-live focus:bg-panel focus:px-1 focus:text-xs focus:text-live"
        >
          skip to the workspace
        </a>
        {children}
      </body>
    </html>
  )
}
