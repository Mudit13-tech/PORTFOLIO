import type { MetadataRoute } from 'next'
import { experiments, failures, meta, projects, skills } from '~/data'
import { APP_ORDER, APP_PATH } from '@/os/routes'

const ORIGIN = 'http://localhost:3000'

/** Every app and every record gets a crawlable, linkable URL. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(`${meta.deployedAt}T00:00:00Z`)

  const apps = APP_ORDER.map((id) => ({ url: `${ORIGIN}${APP_PATH[id]}`, lastModified }))

  const records = [
    ...projects.map((p) => `/projects/${p.id}`),
    ...failures.map((f) => `/failures/${f.id}`),
    ...skills.map((s) => `/skills/${s.id}`),
    ...experiments.map((e) => `/experiments/${e.id}`),
  ].map((path) => ({ url: `${ORIGIN}${path}`, lastModified }))

  return [{ url: ORIGIN, lastModified }, ...apps, ...records]
}
