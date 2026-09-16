import { Workspace } from '@/components/Workspace'
import { loadSnapshot } from '@/lib/snapshot'

/* The snapshot is committed, so the page is static. Daily revalidation picks
   up a freshly committed sample without a manual redeploy. */
export const revalidate = 86400

export default async function Page() {
  const snapshot = await loadSnapshot()
  return <Workspace snapshot={snapshot} />
}
