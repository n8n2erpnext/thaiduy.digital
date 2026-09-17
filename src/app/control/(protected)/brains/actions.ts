'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db/client'
import { auditLogs, brainProfiles, revisions } from '@/db/schema'
import { requireControlOwner } from '@/lib/control-auth'

function jsonObject(value: FormDataEntryValue | null) {
  const parsed = JSON.parse(String(value ?? '{}'))
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error('Brain config must be a JSON object')
  return parsed as Record<string, unknown>
}

export async function saveBrainAction(formData: FormData) {
  const session = await requireControlOwner()
  const brainKey = z.string().min(1).max(128).parse(String(formData.get('brainKey') ?? ''))
  const enabled = formData.get('enabled') === 'on'
  const next = {
    enabled,
    leftConfig: jsonObject(formData.get('leftConfig')),
    rightConfig: jsonObject(formData.get('rightConfig')),
    cortexConfig: jsonObject(formData.get('cortexConfig')),
    memoryConfig: jsonObject(formData.get('memoryConfig')),
    updatedAt: new Date(),
  }
  await db.transaction(async tx => {
    const [before] = await tx.select().from(brainProfiles).where(eq(brainProfiles.brainKey, brainKey)).limit(1)
    if (!before) throw new Error('Brain profile not found')
    const [after] = await tx.update(brainProfiles).set(next).where(eq(brainProfiles.brainKey, brainKey)).returning()
    await tx.insert(revisions).values({ entityType: 'brain_profile', entityId: brainKey, action: 'update', before, after, actorId: session.user.id })
    await tx.insert(auditLogs).values({ actorId: session.user.id, action: enabled ? 'brain.save.enabled' : 'brain.save.disabled', entityType: 'brain_profile', entityId: brainKey })
  })
  revalidatePath('/control/brains')
}
