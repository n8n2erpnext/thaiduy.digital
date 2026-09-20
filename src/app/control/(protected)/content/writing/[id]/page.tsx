import { notFound } from 'next/navigation'
import { CmsPostEditor } from '@/components/control/cms-post-editor'
import { getPostAdmin } from '@/content/posts'
import { getWritingTags } from '@/content/writing-tags'

type Props = { params: Promise<{ id:string }> }

export default async function EditPostPage({ params }: Props) {
  const { id } = await params
  const [post,availableTags]=await Promise.all([
    getPostAdmin(id),
    getWritingTags({includeDisabled:true}),
  ])
  if (!post) notFound()
  return <CmsPostEditor post={post} availableTags={availableTags} />
}
