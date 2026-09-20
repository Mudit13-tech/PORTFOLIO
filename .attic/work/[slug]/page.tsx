import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { projects } from '~/content/projects'
import { Workspace } from '@/components/Workspace'
import { loadSnapshot } from '@/lib/snapshot'

export const revalidate = 86400
export const dynamicParams = false

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const p = projects.find((x) => x.slug === slug)
  if (!p) return {}
  return { title: p.name, description: p.summary }
}

export default async function WorkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!projects.some((p) => p.slug === slug)) notFound()
  const snapshot = await loadSnapshot()
  return <Workspace snapshot={snapshot} attach={slug} />
}
