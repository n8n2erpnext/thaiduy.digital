'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db/client'
import { assets, auditLogs } from '@/db/schema'
import { deleteStoredAsset } from '@/lib/assets'
import { requireControlOwner } from '@/lib/control-auth'

async function audit(actorId: string, action: string, entityId: string, metadata: Record<string, unknown> = {}) {
  await db.insert(auditLogs).values({ actorId, action, entityType: 'asset', entityId, metadata })
}

export async function toggleAsset(id: string) {
  const session = await requireControlOwner()
  const [row] = await db.select().from(assets).where(eq(assets.id, id)).limit(1)
  if (!row || row.deletedAt) return
  const status = row.status === 'hidden' ? 'ready' : 'hidden'
  await db.update(assets).set({ status, updatedAt: new Date() }).where(eq(assets.id, id))
  await audit(session.user.id, 'asset.toggle', id, { status })
  revalidatePath('/control/assets')
}
export async function trashAsset(id: string) {
  const session = await requireControlOwner()
  await db.update(assets).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(assets.id, id))
  await audit(session.user.id, 'asset.trash', id)
  revalidatePath('/control/assets')
}

export async function restoreAsset(id: string) {
  const session = await requireControlOwner()
  await db.update(assets).set({ deletedAt: null, updatedAt: new Date() }).where(eq(assets.id, id))
  await audit(session.user.id, 'asset.restore', id)
  revalidatePath('/control/assets')
}

export async function purgeAsset(id: string) {
  const session = await requireControlOwner()
  const [row] = await db.select().from(assets).where(eq(assets.id, id)).limit(1)
  if (!row) return
  if (row.source === 'upload') await deleteStoredAsset(row.storageKey)
  await db.delete(assets).where(eq(assets.id, id))
  await audit(session.user.id, 'asset.purge', id, { storageKey: row.storageKey })
  revalidatePath('/control/assets')
}
export async function updateAssetMeta(id: string, formData: FormData) {
  const session = await requireControlOwner()
  const altEn = String(formData.get('altEn') ?? '').slice(0, 500) || null
  const altVi = String(formData.get('altVi') ?? '').slice(0, 500) || null
  await db.update(assets).set({ altEn, altVi, updatedAt: new Date() }).where(eq(assets.id, id))
  await audit(session.user.id, 'asset.update', id, { altEn: Boolean(altEn), altVi: Boolean(altVi) })
  revalidatePath('/control/assets')
}
