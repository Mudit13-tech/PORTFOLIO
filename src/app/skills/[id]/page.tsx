import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { skills } from '~/data'
import { SkillDetail } from '@/apps/skills'
import { Desk } from '@/components/shell/Desk'

/* A fixed list, so every record is prerendered and anything else 404s rather
   than being rendered at request time. */
export const dynamicParams = false

export function generateStaticParams() {
  return skills.map((x) => ({ id: x.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const p = skills.find((x) => x.id === id)
  if (!p) return {}
  return { title: p.name, description: `${p.name} — used in ${p.projectIds.length} projects, since ${p.firstUsed}.`.slice(0, 160) }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = skills.find((x) => x.id === id)
  if (!p) notFound()

  return (
    <Desk entry={`/skills/${id}`}>
      <SkillDetail skill={p} />
    </Desk>
  )
}
