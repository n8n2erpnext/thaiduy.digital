import { desc, eq, gt, isNull, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { auditLogs, brainProfiles, featureFlags, runtimeBindings, siteRegistry, trafficEvents, trafficSessions } from '@/db/schema'

export async function getControlOverview() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const [registry] = await db.select({ count: sql<number>`count(*)::int` }).from(siteRegistry).where(isNull(siteRegistry.deletedAt))
  const [flags] = await db.select({ count: sql<number>`count(*)::int` }).from(featureFlags)
  const [brains] = await db.select({ count: sql<number>`count(*)::int` }).from(brainProfiles).where(eq(brainProfiles.enabled, true))
  const [traffic] = await db.select({ count: sql<number>`count(*)::int` }).from(trafficEvents).where(gt(trafficEvents.createdAt, since))
  const [sessions] = await db.select({ count: sql<number>`count(*)::int` }).from(trafficSessions).where(gt(trafficSessions.lastAt, new Date(Date.now() - 5 * 60 * 1000)))
  return { registry: registry.count, flags: flags.count, brains: brains.count, events24h: traffic.count, active5m: sessions.count }
}

export async function getFeatureFlags() {
  return db.select().from(featureFlags).orderBy(featureFlags.key)
}

export async function getRuntimeBindings() {
  return db.select().from(runtimeBindings).orderBy(runtimeBindings.registryKey, runtimeBindings.source)
}

export async function getBrainProfiles() {
  return db.select().from(brainProfiles).orderBy(brainProfiles.brainKey)
}
export async function getTrafficOverview(hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
  const totals = await db.execute(sql`
    select
      count(*) filter (where type = 'pageview')::int as views,
      count(*) filter (where type = 'event')::int as events,
      count(distinct session_id)::int as visitors,
      count(distinct visit_id)::int as visits
    from traffic_events where created_at >= ${since}
  `)
  const topPages = await db.execute(sql`
    select path, count(*)::int total from traffic_events
    where created_at >= ${since} and type = 'pageview'
    group by path order by total desc limit 8
  `)
  const referrers = await db.execute(sql`
    select coalesce(referrer_domain, 'direct') referrer, count(*)::int total from traffic_events
    where created_at >= ${since} and type = 'pageview'
    group by referrer order by total desc limit 8
  `)
  return { totals: totals[0] ?? { views: 0, events: 0, visitors: 0, visits: 0 }, topPages, referrers }
}
export async function getTrafficDimensions(hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
  const countries = await db.execute(sql`
    select coalesce(country, 'unknown') label, count(*)::int total from traffic_events
    where created_at >= ${since} and type = 'pageview'
    group by label order by total desc limit 8
  `)
  const devices = await db.execute(sql`
    select coalesce(device, 'unknown') label, count(*)::int total from traffic_events
    where created_at >= ${since} and type = 'pageview'
    group by label order by total desc limit 8
  `)
  const browsers = await db.execute(sql`
    select coalesce(browser, 'unknown') label, count(*)::int total from traffic_events
    where created_at >= ${since} and type = 'pageview'
    group by label order by total desc limit 8
  `)
  return { countries, devices, browsers }
}

export async function getAuditLog(limit = 100) {
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit)
}

export async function getRealtimeVisitors() {
  try {
    const { ensureRedis } = await import('@/lib/redis')
    const client = await ensureRedis()
    const key = 'analytics:active'
    const now = Date.now()
    await client.zremrangebyscore(key, 0, now - 5 * 60 * 1000)
    return await client.zcard(key)
  } catch {
    return 0
  }
}

export async function getSiteSettings() {
  const { siteSettings } = await import('@/db/schema')
  return db.select().from(siteSettings).orderBy(siteSettings.key)
}

export async function getBrainMemoryStats() {
  return db.execute(sql`
    select brain_key, hemisphere, count(*)::int entries, max(learned_at) last_learned
    from brain_memory group by brain_key, hemisphere order by brain_key, hemisphere
  `)
}
