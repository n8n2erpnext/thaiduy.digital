'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { setCommunityMemberStatus } from '@/community/data'
import { requireControlOwner } from '@/lib/control-auth'

const statusSchema=z.enum(['active','blocked'])

export async function setCommunityUserStatusAction(formData:FormData) {
  const session=await requireControlOwner()
  const userId=z.string().min(1).max(256).parse(String(formData.get('userId') ?? ''))
  const status=statusSchema.parse(String(formData.get('status') ?? ''))
  await setCommunityMemberStatus(userId,status,session.user.id)
  revalidatePath('/control/community')
  revalidatePath('/control/community/users')
  revalidatePath('/discuss')
}
