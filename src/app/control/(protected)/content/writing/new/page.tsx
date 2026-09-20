import { CmsPostEditor } from '@/components/control/cms-post-editor'
import { getWritingTags } from '@/content/writing-tags'

export default async function NewPostPage() {
  const availableTags=await getWritingTags({includeDisabled:true})
  return <CmsPostEditor availableTags={availableTags} />
}
