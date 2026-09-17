'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db/client'
import { auditLogs, featureFlags, siteSettings } from '@/db/schema'
import { requireControlOwner } from '@/lib/control-auth'

export async function toggleFeatureAction(formData: FormData) {
  const session = await requireControlOwner()
  const key = z.string().min(1).max(128).parse(String(formData.get('key') ?? ''))
  const enabled = formData.get('enabled') === 'true'
  await db.transaction(async tx => {
    await tx.update(featureFlags).set({ enabled, updatedBy: session.user.id, updatedAt: new Date() }).where(eq(featureFlags.key, key))
    await tx.insert(auditLogs).values({ actorId: session.user.id, action: enabled ? 'feature.enable' : 'feature.disable', entityType: 'feature_flag', entityId: key })
  })
  revalidatePath('/control/settings')
  revalidatePath('/')
}

export async function saveSettingAction(formData: FormData) {
  const session = await requireControlOwner()
  const key = z.string().min(1).max(128).parse(String(formData.get('key') ?? '').trim())
  const raw = String(formData.get('value') ?? '').trim()
  const value = JSON.parse(raw)
  await db.transaction(async tx => {
    await tx.insert(siteSettings).values({ key, value, updatedBy: session.user.id, updatedAt: new Date() })
      .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedBy: session.user.id, updatedAt: new Date() } })
    await tx.insert(auditLogs).values({ actorId: session.user.id, action: 'setting.save', entityType: 'site_setting', entityId: key })
  })
  revalidatePath('/control/settings')
  revalidatePath('/')
}
