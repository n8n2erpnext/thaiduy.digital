import { and, asc, desc, eq, isNull } from 'drizzle-orm'
import { db } from '@/db/client'
import { auditLogs, revisions, siteRegistry } from '@/db/schema'
import type { ManagedRegistryItem, RegistryKind, RegistryStatus } from './types'

const toItem = (row: typeof siteRegistry.$inferSelect): ManagedRegistryItem => ({
  id: row.id,
  key: row.key,
  kind: row.kind as RegistryKind,
  enabled: row.enabled,
  status: row.status as RegistryStatus,
  sort: row.sort,
  parentKey: row.parentKey,
  label: { en: row.labelEn, vi: row.labelVi },
  title: row.titleEn || row.titleVi ? { en: row.titleEn ?? '', vi: row.titleVi ?? '' } : undefined,
  summary: row.summaryEn || row.summaryVi ? { en: row.summaryEn ?? '', vi: row.summaryVi ?? '' } : undefined,
  meta: row.meta,
  runtimeKey: row.runtimeKey,
  deletedAt: row.deletedAt, createdAt: row.createdAt, updatedAt: row.updatedAt,
})

export async function getRegistryAll(kind: RegistryKind) {
  const rows = await db.select().from(siteRegistry)
    .where(eq(siteRegistry.kind, kind))
    .orderBy(asc(siteRegistry.sort))
  return rows.map(toItem)
}

export async function getRegistry(kind: RegistryKind) {
  const rows = await db.select().from(siteRegistry).where(and(
    eq(siteRegistry.kind, kind),
    eq(siteRegistry.enabled, true),
    eq(siteRegistry.status, 'published'),
    isNull(siteRegistry.deletedAt),
  )).orderBy(asc(siteRegistry.sort))
  return rows.map(toItem)
}
export async function getRegistryByKey(key: string) {
  const [row] = await db.select().from(siteRegistry)
    .where(eq(siteRegistry.key, key))
    .limit(1)
  return row ? toItem(row) : null
}

export async function getPublishedRegistryItem(kind: RegistryKind, key: string) {
  const [row] = await db.select().from(siteRegistry).where(and(
    eq(siteRegistry.kind, kind),
    eq(siteRegistry.key, key),
    eq(siteRegistry.enabled, true),
    eq(siteRegistry.status, 'published'),
    isNull(siteRegistry.deletedAt),
  )).limit(1)
  return row ? toItem(row) : null
}

export async function getPublishedRegistryChildren(kind: RegistryKind, parentKey: string) {
  const rows = await db.select().from(siteRegistry).where(and(
    eq(siteRegistry.kind, kind),
    eq(siteRegistry.parentKey, parentKey),
    eq(siteRegistry.enabled, true),
    eq(siteRegistry.status, 'published'),
    isNull(siteRegistry.deletedAt),
  )).orderBy(asc(siteRegistry.sort))
  return rows.map(toItem)
}

export async function getRegistryAdmin() {
  const rows = await db.select().from(siteRegistry).orderBy(
    asc(siteRegistry.kind), asc(siteRegistry.sort), desc(siteRegistry.updatedAt),
  )
  return rows.map(toItem)
}

export async function getRegistryItem(id: string) {
  const [row] = await db.select().from(siteRegistry).where(eq(siteRegistry.id, id)).limit(1)
  return row ? toItem(row) : null
}

type RegistryInput = {
  key: string
  kind: RegistryKind
  enabled: boolean
  status: RegistryStatus
  sort: number
  parentKey?: string | null
  labelEn: string
  labelVi: string
  titleEn?: string | null
  titleVi?: string | null
  summaryEn?: string | null
  summaryVi?: string | null
  runtimeKey?: string | null
  meta?: Record<string, unknown>
}
export async function saveRegistryItem(input: RegistryInput, actorId: string, id?: string) {
  return db.transaction(async tx => {
    const now = new Date()
    if (id) {
      const [before] = await tx.select().from(siteRegistry).where(eq(siteRegistry.id, id)).limit(1)
      if (!before) throw new Error('Registry item not found')
      const [after] = await tx.update(siteRegistry).set({ ...input, updatedAt: now }).where(eq(siteRegistry.id, id)).returning()
      await tx.insert(revisions).values({ entityType: 'site_registry', entityId: id, action: 'update', before, after, actorId })
      await tx.insert(auditLogs).values({ actorId, action: 'registry.update', entityType: 'site_registry', entityId: id })
      return toItem(after)
    }

    const [created] = await tx.insert(siteRegistry).values({ ...input, createdAt: now, updatedAt: now }).returning()
    await tx.insert(revisions).values({ entityType: 'site_registry', entityId: created.id, action: 'create', after: created, actorId })
    await tx.insert(auditLogs).values({ actorId, action: 'registry.create', entityType: 'site_registry', entityId: created.id })
    return toItem(created)
  })
}

export async function setRegistryEnabled(id: string, enabled: boolean, actorId: string) {
  return db.transaction(async tx => {
    const [before] = await tx.select().from(siteRegistry).where(eq(siteRegistry.id, id)).limit(1)
    if (!before) throw new Error('Registry item not found')
    const [after] = await tx.update(siteRegistry).set({ enabled, updatedAt: new Date() }).where(eq(siteRegistry.id, id)).returning()
    await tx.insert(revisions).values({ entityType: 'site_registry', entityId: id, action: enabled ? 'enable' : 'disable', before, after, actorId })
    await tx.insert(auditLogs).values({ actorId, action: enabled ? 'registry.enable' : 'registry.disable', entityType: 'site_registry', entityId: id })
    return toItem(after)
  })
}
export async function softDeleteRegistry(id: string, actorId: string) {
  return db.transaction(async tx => {
    const [before] = await tx.select().from(siteRegistry).where(eq(siteRegistry.id, id)).limit(1)
    if (!before) throw new Error('Registry item not found')
    const [after] = await tx.update(siteRegistry).set({ enabled: false, status: 'archived', deletedAt: new Date(), updatedAt: new Date() }).where(eq(siteRegistry.id, id)).returning()
    await tx.insert(revisions).values({ entityType: 'site_registry', entityId: id, action: 'delete', before, after, actorId })
    await tx.insert(auditLogs).values({ actorId, action: 'registry.delete', entityType: 'site_registry', entityId: id })
    return toItem(after)
  })
}

export async function restoreRegistry(id: string, actorId: string) {
  return db.transaction(async tx => {
    const [before] = await tx.select().from(siteRegistry).where(eq(siteRegistry.id, id)).limit(1)
    if (!before) throw new Error('Registry item not found')
    const [after] = await tx.update(siteRegistry).set({ deletedAt: null, status: 'draft', updatedAt: new Date() }).where(eq(siteRegistry.id, id)).returning()
    await tx.insert(revisions).values({ entityType: 'site_registry', entityId: id, action: 'restore', before, after, actorId })
    await tx.insert(auditLogs).values({ actorId, action: 'registry.restore', entityType: 'site_registry', entityId: id })
    return toItem(after)
  })
}

export async function purgeRegistry(id: string, actorId: string) {
  return db.transaction(async tx => {
    const [before] = await tx.select().from(siteRegistry).where(eq(siteRegistry.id, id)).limit(1)
    if (!before) return
    await tx.delete(siteRegistry).where(eq(siteRegistry.id, id))
    await tx.insert(auditLogs).values({ actorId, action: 'registry.purge', entityType: 'site_registry', entityId: id, metadata: { key: before.key } })
  })
}
