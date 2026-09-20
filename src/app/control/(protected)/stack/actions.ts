'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/db/client'
import { auditLogs } from '@/db/schema'
import { requireControlOwner } from '@/lib/control-auth'
import { requestStackDiscoveryRefresh } from '@/server/stack/snapshot'

export async function refreshStackStatusAction() {
  const session = await requireControlOwner()
  const requestedAt = await requestStackDiscoveryRefresh(session.user.id)

  await db.insert(auditLogs).values({
    actorId:session.user.id,
    action:'stack.status.refresh.requested',
    entityType:'stack_runtime',
    entityId:'host-arm-main',
    metadata:{ requestedAt },
  })

  revalidatePath('/control/stack')
}
