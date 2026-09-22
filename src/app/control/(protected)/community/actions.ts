'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  moderateCommunityItem,
  trashCommunityItem,
  type CommunityStatus,
} from '@/community/data'
import { requireControlOwner } from '@/lib/control-auth'

const kindSchema=z.enum(['thread','reply'])
const statusSchema=z.enum(['approved','rejected','hidden'])

function refresh(threadId:string) {
  revalidatePath('/control/community')
  revalidatePath('/guestbook')
  revalidatePath('/guestbook/'+threadId)
}

export async function moderateCommunityAction(formData:FormData) {
  const session=await requireControlOwner()
  const kind=kindSchema.parse(String(formData.get('kind') ?? ''))
  const id=z.uuid().parse(String(formData.get('id') ?? ''))
  const threadId=z.uuid().parse(String(formData.get('threadId') ?? ''))
  const status=statusSchema.parse(String(formData.get('status') ?? '')) as CommunityStatus
  await moderateCommunityItem(kind,id,status,session.user.id)
  refresh(threadId)
}

export async function trashCommunityAction(formData:FormData) {
  const session=await requireControlOwner()
  const kind=kindSchema.parse(String(formData.get('kind') ?? ''))
  const id=z.uuid().parse(String(formData.get('id') ?? ''))
  const threadId=z.uuid().parse(String(formData.get('threadId') ?? ''))
  await trashCommunityItem(kind,id,session.user.id)
  refresh(threadId)
}
