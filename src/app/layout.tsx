import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { meta, profile } from '~/data'
import { SystemProvider } from '@/os/SystemProvider'
import { ORIGIN } from '@/lib/site'
import './globals.css'
import './lock.css'

/**
 * Two families, clearly distinct. Geist Sans carries the interface; Geist Mono
 * is reserved for anything the system says about itself — terminal, logs,
 * errors, timestamps, file paths, metrics. When mono appears it means "this is
 * machine output", and using it decoratively would destroy that signal.
 */
const sans = Geist({ subsets: ['latin'], display: 'swap', variable: '--font-geist' })
const mono = Geist_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-geist-mono' })

/** What a search result or a link preview says before anyone opens the page. */
const summary = `${profile.discipline} at ${profile.institution}. ${meta.description}`

export const metadata: Metadata = {
  metadataBase: new URL(ORIGIN),
  title: { default: `${profile.name} — ${meta.systemName}`, template: `%s · ${meta.systemName}` },
  description: summary,
  applicationName: meta.systemName,
  authors: [{ name: profile.name, url: profile.links.linkedin ?? profile.links.github }],
  creator: profile.name,
  openGraph: {
    title: `${profile.name} — ${meta.systemName}`,
    description: summary,
    type: 'profile',
    siteName: meta.systemName,
    locale: 'en_IN',
    firstName: profile.name.split(' ')[0],
    lastName: profile.name.split(' ').slice(1).join(' '),
  },
  twitter: {
    card: 'summary_large_image',
    title: `${profile.name} — ${meta.systemName}`,
    description: summary,
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  // Android: the keyboard shrinks the layout viewport instead of covering it,
  // so the terminal's command line rides up with it. iOS ignores this and is
  // handled in the phone shell.
  interactiveWidget: 'resizes-content',
  colorScheme: 'dark light',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#14171A' },
    { media: '(prefers-color-scheme: light)', color: '#E8E6E0' },
  ],
}

/**
 * Stamped before first paint so the theme and the icon finish are settled by the time anything
 * renders. Every access is wrapped — private browsing throws on localStorage,
 * and a portfolio that white-screens in a private window fails the one test a
 * cautious visitor runs.
 */
const PREFLIGHT = `(function(){var d=document.documentElement;
try{var s=localStorage,t=s.getItem('mudit-os.v1.theme');
if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}
d.dataset.theme=t}catch(e){d.dataset.theme='dark'}
try{var i=localStorage.getItem('mudit-os.v1.icons');
d.dataset.icons=i==='paper'||i==='ink'||i==='glaze'?i:'studio'}catch(e){d.dataset.icons='studio'}})()`

/**
 * The other half of the progressive enhancement, and the half that cannot
 * fail: the stylesheet hides the plain document, and this puts it back when
 * scripting is off. The browser applies it at parse time, no script runs, and
 * nothing in the React tree can undo it.
 */
const NO_JS = `<style>.static-doc{display:block}.os-shell,.lock{display:none}</style>`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    jobTitle: profile.role,
    affiliation: { '@type': 'CollegeOrUniversity', name: profile.institution },
    url: ORIGIN,
    ...(profile.links.email ? { email: profile.links.email } : {}),
    sameAs: [profile.links.linkedin, profile.links.github, profile.links.leetcode].filter(Boolean),
  }

  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFLIGHT }} />
        <noscript dangerouslySetInnerHTML={{ __html: NO_JS }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      </head>
      <body>
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[2000] focus:bg-window focus:border focus:border-focus focus:px-2 focus:py-1 focus:mono focus:text-[12px]"
        >
          Skip to content
        </a>
        <SystemProvider>{children}</SystemProvider>
      </body>
    </html>
  )
}
