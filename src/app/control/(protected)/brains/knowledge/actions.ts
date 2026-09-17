'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { seedDefaultMusicKnowledge } from '@/brains/music-sensor/seed'
import { db } from '@/db/client'
import { auditLogs, brainMemory, revisions } from '@/db/schema'
import { requireControlOwner } from '@/lib/control-auth'

function parseId(formData: FormData) {
  return z.coerce.number().int().positive().parse(formData.get('id'))
}

function entityId(row: { brainKey:string; hemisphere:string; memoryKey:string }) {
  return `${row.brainKey}:${row.hemisphere}:${row.memoryKey}`.slice(0, 160)
}

export async function saveKnowledgeAction(formData: FormData) {
  const session = await requireControlOwner()
  const id = parseId(formData)
  const raw = String(formData.get('value') ?? '{}')
  const value = JSON.parse(raw)
  const confidence = z.coerce.number().min(0).max(1).parse(formData.get('confidence'))
  await db.transaction(async tx => {
    const [before] = await tx.select().from(brainMemory).where(eq(brainMemory.id, id)).limit(1)
    if (!before) throw new Error('Knowledge entry not found')
    const [after] = await tx.update(brainMemory).set({ value, confidence, learnedAt:new Date() })
      .where(eq(brainMemory.id, id)).returning()
    const eid = entityId(before)
    await tx.insert(revisions).values({ entityType:'brain_knowledge', entityId:eid, action:'update', before, after, actorId:session.user.id })
    await tx.insert(auditLogs).values({ actorId:session.user.id, action:'brain.knowledge.update', entityType:'brain_knowledge', entityId:eid })
  })
  revalidatePath('/control/brains')
  revalidatePath('/control/brains/knowledge')
}

export async function toggleKnowledgeAction(formData: FormData) {
  const session = await requireControlOwner()
  const id = parseId(formData)
  await db.transaction(async tx => {
    const [before] = await tx.select().from(brainMemory).where(eq(brainMemory.id, id)).limit(1)
    if (!before) throw new Error('Knowledge entry not found')
    const current = before.value as Record<string, unknown>
    const enabled = current.enabled !== false
    const value = { ...current, enabled:!enabled }
    const [after] = await tx.update(brainMemory).set({ value, learnedAt:new Date() })
      .where(eq(brainMemory.id, id)).returning()
    const eid = entityId(before)
    await tx.insert(revisions).values({ entityType:'brain_knowledge', entityId:eid, action:enabled ? 'disable' : 'enable', before, after, actorId:session.user.id })
    await tx.insert(auditLogs).values({ actorId:session.user.id, action:enabled ? 'brain.knowledge.disable' : 'brain.knowledge.enable', entityType:'brain_knowledge', entityId:eid })
  })
  revalidatePath('/control/brains/knowledge')
}

export async function deleteKnowledgeAction(formData: FormData) {
  const session = await requireControlOwner()
  const id = parseId(formData)
  await db.transaction(async tx => {
    const [before] = await tx.select().from(brainMemory).where(eq(brainMemory.id, id)).limit(1)
    if (!before) return
    const eid = entityId(before)
    await tx.delete(brainMemory).where(eq(brainMemory.id, id))
    await tx.insert(revisions).values({ entityType:'brain_knowledge', entityId:eid, action:'delete', before, actorId:session.user.id })
    await tx.insert(auditLogs).values({ actorId:session.user.id, action:'brain.knowledge.delete', entityType:'brain_knowledge', entityId:eid })
  })
  revalidatePath('/control/brains')
  revalidatePath('/control/brains/knowledge')
}

export async function reseedKnowledgeAction() {
  const session = await requireControlOwner()
  const result = await seedDefaultMusicKnowledge()
  await db.insert(auditLogs).values({
    actorId:session.user.id, action:'brain.knowledge.reseed',
    entityType:'brain_knowledge', entityId:'sentinel-music:music-default-pack',
    metadata:result,
  })
  revalidatePath('/control/brains')
  revalidatePath('/control/brains/knowledge')
}
