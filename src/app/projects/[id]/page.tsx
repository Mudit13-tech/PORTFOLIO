import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { projects } from '~/data'
import { ProjectDetail } from '@/apps/projects'
import { Desk } from '@/components/shell/Desk'
import { excerpt } from '@/lib/site'

/* A fixed list, so every record is prerendered and anything else 404s rather
   than being rendered at request time. */
export const dynamicParams = false

export function generateStaticParams() {
  return projects.map((x) => ({ id: x.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const p = projects.find((x) => x.id === id)
  if (!p) return {}
  return { title: p.name, description: excerpt(p.problem) }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = projects.find((x) => x.id === id)
  if (!p) notFound()

  return (
    <Desk entry={`/projects/${id}`}>
      <ProjectDetail project={p} />
    </Desk>
  )
}
