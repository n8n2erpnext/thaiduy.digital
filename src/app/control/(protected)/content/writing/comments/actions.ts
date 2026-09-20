'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  moderateArticleComment,
  trashArticleComment,
} from '@/content/engagement'
import { requireControlOwner } from '@/lib/control-auth'

function id(formData:FormData) {
  return z.uuid().parse(String(formData.get('id') ?? ''))
}

function refresh(slug?:string) {
  revalidatePath('/control/content/writing')
  revalidatePath('/control/content/writing/comments')
  if (slug) revalidatePath('/writing/' + slug)
}

export async function approveCommentAction(formData:FormData) {
  const session = await requireControlOwner()
  await moderateArticleComment(id(formData),'approved',session.user.id)
  refresh(String(formData.get('slug') ?? ''))
}
export async function rejectCommentAction(formData:FormData) {
  const session = await requireControlOwner()
  await moderateArticleComment(id(formData),'rejected',session.user.id)
  refresh(String(formData.get('slug') ?? ''))
}

export async function trashCommentAction(formData:FormData) {
  const session = await requireControlOwner()
  await trashArticleComment(id(formData),session.user.id)
  refresh(String(formData.get('slug') ?? ''))
}
