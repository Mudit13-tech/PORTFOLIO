/**
 * The public origin, for every absolute URL the system prints: the metadata
 * base, the sitemap, robots and the share card.
 *
 * Set `NEXT_PUBLIC_SITE_URL` once there is a domain. On Vercel the production
 * domain is read from the platform's own variable, so a deploy there is right
 * with no configuration at all; anywhere else it falls back to the dev server.
 */
const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL

export const ORIGIN = (
  process.env.NEXT_PUBLIC_SITE_URL || (vercel ? `https://${vercel}` : 'http://localhost:3000')
).replace(/\/+$/, '')

/**
 * A search-result-length summary: whole sentences while they fit, otherwise
 * whole words and an ellipsis. Never a word cut in half.
 */
export function excerpt(text: string, max = 160): string {
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  const sentences = t.split(/(?<=[.!?])\s+/)
  let out = ''
  for (const s of sentences) {
    if ((out ? out.length + 1 : 0) + s.length > max) break
    out = out ? `${out} ${s}` : s
  }
  if (out) return out
  const cut = t.slice(0, max - 1)
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:—–-]+$/, '')}…`
}
