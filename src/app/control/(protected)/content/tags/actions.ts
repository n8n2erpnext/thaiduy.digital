'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createWritingTag, updateWritingTag } from '@/content/writing-tags'
import { requireControlOwner } from '@/lib/control-auth'

function text(form:FormData,key:string,max=128) {
  return String(form.get(key) ?? '').slice(0,max)
}

function refreshTags() {
  revalidatePath('/control/content')
  revalidatePath('/control/content/tags')
  revalidatePath('/control/content/writing')
  revalidatePath('/control/content/writing/new')
  revalidatePath('/writing')
}

export async function createWritingTagAction(formData:FormData) {
  const session=await requireControlOwner()
  await createWritingTag({
    name:text(formData,'name',64),
    color:text(formData,'color',7),
  },session.user.id)
  refreshTags()
  redirect('/control/content/tags?created=1')
}

export async function updateWritingTagAction(formData:FormData) {
  const session=await requireControlOwner()
  const id=z.uuid().parse(text(formData,'id',64))
  await updateWritingTag(id,{
    name:text(formData,'name',64),
    color:text(formData,'color',7),
    enabled:formData.get('enabled')==='on',
  },session.user.id)
  refreshTags()
  redirect('/control/content/tags?saved=1')
}
