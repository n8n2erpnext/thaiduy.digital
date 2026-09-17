'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db/client'
import { auditLogs, revisions, runtimeBindings } from '@/db/schema'
import { requireControlOwner } from '@/lib/control-auth'

const text = z.string().trim().min(1).max(128)

function parseFields(raw: string) {
  const value = JSON.parse(raw || '[]')
  return z.array(z.string().min(1).max(128)).max(64).parse(value)
}

function parseConfig(raw: string) {
  const value = JSON.parse(raw || '{}')
  return z.record(z.string(), z.unknown()).parse(value)
}

export async function saveRuntimeBindingAction(formData: FormData) {
  const session = await requireControlOwner()
  const id = String(formData.get('id') ?? '').trim()
  const registryKey = text.parse(String(formData.get('registryKey') ?? ''))
  const source = text.parse(String(formData.get('source') ?? ''))
  const enabled = formData.get('enabled') === 'true'
  const publicFields = parseFields(String(formData.get('publicFields') ?? '[]'))
  const config = parseConfig(String(formData.get('config') ?? '{}'))

  await db.transaction(async tx => {
    if (id) {
      const [before] = await tx.select().from(runtimeBindings).where(eq(runtimeBindings.id, id)).limit(1)
      if (!before) throw new Error('binding_not_found')
      const [after] = await tx.update(runtimeBindings).set({
        registryKey, source, enabled, publicFields, config, updatedAt: new Date(),
      }).where(eq(runtimeBindings.id, id)).returning()
      await tx.insert(revisions).values({ entityType: 'runtime_binding', entityId: id, action: 'update', before, after, actorId: session.user.id })
      await tx.insert(auditLogs).values({ actorId: session.user.id, action: 'runtime_binding.update', entityType: 'runtime_binding', entityId: id })
    } else {
      const [after] = await tx.insert(runtimeBindings).values({ registryKey, source, enabled, publicFields, config }).returning()
      await tx.insert(revisions).values({ entityType: 'runtime_binding', entityId: after.id, action: 'create', after, actorId: session.user.id })
      await tx.insert(auditLogs).values({ actorId: session.user.id, action: 'runtime_binding.create', entityType: 'runtime_binding', entityId: after.id })
    }
  })
  revalidatePath('/control/runtime')
  revalidatePath('/')
}

export async function deleteRuntimeBindingAction(formData: FormData) {
  const session = await requireControlOwner()
  const id = z.uuid().parse(String(formData.get('id') ?? ''))
  await db.transaction(async tx => {
    const [before] = await tx.select().from(runtimeBindings).where(eq(runtimeBindings.id, id)).limit(1)
    if (!before) return
    await tx.delete(runtimeBindings).where(eq(runtimeBindings.id, id))
    await tx.insert(revisions).values({ entityType: 'runtime_binding', entityId: id, action: 'delete', before, actorId: session.user.id })
    await tx.insert(auditLogs).values({ actorId: session.user.id, action: 'runtime_binding.delete', entityType: 'runtime_binding', entityId: id })
  })
  revalidatePath('/control/runtime')
  revalidatePath('/')
}
