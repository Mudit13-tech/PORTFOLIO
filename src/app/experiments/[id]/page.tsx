import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { experiments } from '~/data'
import { ExperimentDetail } from '@/apps/misc'
import { Desk } from '@/components/shell/Desk'

/* A fixed list, so every record is prerendered and anything else 404s rather
   than being rendered at request time. */
export const dynamicParams = false

export function generateStaticParams() {
  return experiments.map((x) => ({ id: x.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const p = experiments.find((x) => x.id === id)
  if (!p) return {}
  return { title: p.name, description: p.tested.slice(0, 160) }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = experiments.find((x) => x.id === id)
  if (!p) notFound()

  return (
    <Desk entry={`/experiments/${id}`}>
      <ExperimentDetail experiment={p} />
    </Desk>
  )
}
