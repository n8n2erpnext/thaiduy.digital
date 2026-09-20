import { notFound } from 'next/navigation'
import { CmsProjectEditor } from '@/components/control/cms-project-editor'
import { getRegistryItem } from '@/content/repository'
import { getLivePublicStackGraph } from '@/server/stack/public'
import { projectRuntimeFromStack } from '@/server/stack/projection'

type Props = { params: Promise<{ id:string }> }

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params
  const [project,{ graph }] = await Promise.all([
    getRegistryItem(id),
    getLivePublicStackGraph(),
  ])
  if (!project || project.kind !== 'project') notFound()
  const runtime = await projectRuntimeFromStack(graph)
  return <CmsProjectEditor project={project} runtime={runtime[project.key] ?? null} />
}
