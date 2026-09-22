'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  moderateCommunityItem,
  setCommunityThreadFlag,
  trashCommunityItem,
  type CommunityStatus,
} from '@/community/data'
import { requireControlOwner } from '@/lib/control-auth'

const kindSchema=z.enum(['thread','reply'])
const statusSchema=z.enum(['approved','rejected','hidden'])

function refresh(threadId:string) {
  revalidatePath('/control/community')
  revalidatePath('/control/community/'+threadId)
  revalidatePath('/discuss')
  revalidatePath('/discuss/'+threadId)
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


export async function setCommunityThreadFlagAction(formData:FormData) {
  const session=await requireControlOwner()
  const threadId=z.uuid().parse(String(formData.get('threadId') ?? ''))
  const flag=z.enum(['pinned','locked']).parse(String(formData.get('flag') ?? ''))
  const value=String(formData.get('value') ?? '')==='true'
  await setCommunityThreadFlag(threadId,flag,value,session.user.id)
  refresh(threadId)
}
