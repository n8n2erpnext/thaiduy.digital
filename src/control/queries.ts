import { desc, eq, gt, isNull, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { assets, auditLogs, brainProfiles, cvSnapshots, featureFlags, posts, runtimeBindings, siteRegistry, trafficEvents, trafficSessions } from '@/db/schema'

export async function getControlOverview() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const [registry] = await db.select({ count: sql<number>`count(*)::int` }).from(siteRegistry).where(isNull(siteRegistry.deletedAt))
  const [flags] = await db.select({ count: sql<number>`count(*)::int` }).from(featureFlags)
  const [brains] = await db.select({ count: sql<number>`count(*)::int` }).from(brainProfiles).where(eq(brainProfiles.enabled, true))
  const [traffic] = await db.select({ count: sql<number>`count(*)::int` }).from(trafficEvents).where(gt(trafficEvents.createdAt, since))
  const [sessions] = await db.select({ count: sql<number>`count(*)::int` }).from(trafficSessions).where(gt(trafficSessions.lastAt, new Date(Date.now() - 5 * 60 * 1000)))
  const [readyAssets] = await db.select({ count: sql<number>`count(*)::int` }).from(assets)
    .where(sql`${assets.deletedAt} is null and ${assets.status} = 'ready'`)
  const [publishedPosts] = await db.select({ count: sql<number>`count(*)::int` }).from(posts)
    .where(sql`${posts.deletedAt} is null and ${posts.status} = 'published'`)
  const [runtime] = await db.select({ count: sql<number>`count(*)::int` }).from(runtimeBindings).where(eq(runtimeBindings.enabled, true))
  const [cvIssued] = await db.select({ count: sql<number>`count(*)::int` }).from(cvSnapshots).where(gt(cvSnapshots.issuedAt, since))
  return {
    registry: registry.count,
    flags: flags.count,
    brains: brains.count,
    events24h: traffic.count,
    active5m: sessions.count,
    readyAssets: readyAssets.count,
    publishedPosts: publishedPosts.count,
    runtimeBindings: runtime.count,
    cvIssued24h: cvIssued.count,
  }
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
    select
      path,
      count(*)::int as total,
      count(distinct session_id)::int as visitors,
      count(distinct visit_id)::int as visits
    from traffic_events
    where created_at >= ${since} and type = 'pageview'
    group by path
    order by total desc
    limit 10
  `)
  const referrers = await db.execute(sql`
    select
      coalesce(referrer_domain, 'direct') as referrer,
      count(*)::int as total,
      count(distinct session_id)::int as visitors
    from traffic_events
    where created_at >= ${since} and type = 'pageview'
    group by referrer
    order by total desc
    limit 10
  `)
  return { totals: totals[0] ?? { views: 0, events: 0, visitors: 0, visits: 0 }, topPages, referrers }
}
export async function getTrafficDimensions(hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
  const countries = await db.execute(sql`
    select
      coalesce(
        nullif(country,''),
        case
          when nullif(properties->>'timezone','') is not null then 'TZ · ' || (properties->>'timezone')
          else 'unknown'
        end
      ) label,
      count(*)::int total
    from traffic_events
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
  const operatingSystems = await db.execute(sql`
    select coalesce(os, 'unknown') label, count(*)::int total from traffic_events
    where created_at >= ${since} and type = 'pageview'
    group by label order by total desc limit 8
  `)
  const utmSources = await db.execute(sql`
    select utm_source label, count(*)::int total from traffic_events
    where created_at >= ${since} and type = 'pageview' and utm_source is not null
    group by label order by total desc limit 8
  `)
  const campaigns = await db.execute(sql`
    select utm_campaign label, count(*)::int total from traffic_events
    where created_at >= ${since} and type = 'pageview' and utm_campaign is not null
    group by label order by total desc limit 8
  `)
  return { countries, devices, browsers, operatingSystems, utmSources, campaigns }
}


export async function getTrafficEventDetail(hours = 24, limit = 10, page = 1) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
  const safeLimit = [10,20,30].includes(limit) ? limit : 10
  const safePage = Math.max(1, Number.isFinite(page) ? Math.floor(page) : 1)

  const topEvents = await db.execute(sql`
    select
      coalesce(name, 'unnamed') as name,
      count(*)::int as total,
      count(distinct session_id)::int as visitors
    from traffic_events
    where created_at >= ${since} and type = 'event'
    group by name
    order by total desc, name asc
    limit 12
  `)

  const totalRows = await db.execute(sql`
    select count(*)::int as total
    from traffic_events
    where created_at >= ${since} and type in ('pageview','event')
  `)
  const total = Number(totalRows[0]?.total ?? 0)
  const pages = Math.max(1, Math.ceil(total / safeLimit))
  const currentPage = Math.min(safePage, pages)
  const currentOffset = (currentPage - 1) * safeLimit

  const recent = await db.execute(sql`
    select
      type,
      coalesce(name, '') as name,
      path,
      coalesce(
        nullif(country,''),
        case
          when nullif(properties->>'timezone','') is not null then 'TZ · ' || (properties->>'timezone')
          else '—'
        end
      ) as location,
      coalesce(device, '—') as device,
      coalesce(browser, '—') as browser,
      created_at
    from traffic_events
    where created_at >= ${since} and type in ('pageview','event')
    order by created_at desc
    limit ${safeLimit} offset ${currentOffset}
  `)

  return { topEvents, recent, total, page: currentPage, pages, limit: safeLimit }
}

export async function getCvTraffic(hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
  const rows = await db.execute(sql`
    select
      count(*) filter (where type = 'pageview' and path = '/cv')::int as views,
      count(distinct session_id) filter (where type = 'pageview' and path = '/cv')::int as visitors,
      count(*) filter (where type = 'event' and path = '/cv' and name = 'cv_print')::int as prints,
      count(*) filter (where type = 'event' and path = '/cv' and name = 'cv_pdf')::int as pdf,
      count(*) filter (where type = 'event' and path = '/cv' and name = 'cv_verify')::int as verify,
      count(*) filter (where type = 'event' and path = '/cv' and name = 'cv_copy_id')::int as copies
    from traffic_events
    where created_at >= ${since}
  `)
  return rows[0] ?? { views:0, visitors:0, prints:0, pdf:0, verify:0, copies:0 }
}


export async function getCvTrafficDetail(hours = 24, limit = 10, page = 1) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
  const safeLimit = [10,20,30].includes(limit) ? limit : 10
  const safePage = Math.max(1, Number.isFinite(page) ? Math.floor(page) : 1)

  const totalRows = await db.execute(sql`
    select count(*)::int as total
    from traffic_events
    where created_at >= ${since}
      and path = '/cv'
      and (type = 'pageview' or (type = 'event' and name like 'cv_%'))
  `)
  const total = Number(totalRows[0]?.total ?? 0)
  const pages = Math.max(1, Math.ceil(total / safeLimit))
  const currentPage = Math.min(safePage, pages)
  const currentOffset = (currentPage - 1) * safeLimit

  const recent = await db.execute(sql`
    select
      type,
      coalesce(name, '') as name,
      path,
      coalesce(
        nullif(country,''),
        case
          when nullif(properties->>'timezone','') is not null then 'TZ · ' || (properties->>'timezone')
          else '—'
        end
      ) as location,
      coalesce(device, '—') as device,
      coalesce(browser, '—') as browser,
      created_at
    from traffic_events
    where created_at >= ${since}
      and path = '/cv'
      and (type = 'pageview' or (type = 'event' and name like 'cv_%'))
    order by created_at desc
    limit ${safeLimit} offset ${currentOffset}
  `)

  return { recent, total, page: currentPage, pages, limit: safeLimit }
}

export async function getTrafficDailySeries(days = 7) {
  const safeDays = Math.min(30, Math.max(2, Number.isFinite(days) ? Math.floor(days) : 7))
  const rows = await db.execute(sql`
    with day_series as (
      select
        ((current_timestamp at time zone 'Asia/Ho_Chi_Minh')::date - n)::date as day
      from generate_series((${safeDays - 1})::int,0,-1) as n
    )
    select
      to_char(d.day, 'DD Mon') as label,
      count(e.id) filter (where e.type = 'pageview')::int as views,
      count(e.id) filter (where e.type = 'event')::int as events,
      count(distinct e.session_id)::int as visitors
    from day_series d
    left join traffic_events e
      on (e.created_at at time zone 'Asia/Ho_Chi_Minh')::date = d.day
    group by d.day
    order by d.day
  `)
  return rows
}

export async function getAuditLog(limit = 100) {
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit)
}


export async function getAuditLogPage(limit = 10, page = 1) {
  const safeLimit = [10,20,30].includes(limit) ? limit : 10
  const safePage = Math.max(1, Number.isFinite(page) ? Math.floor(page) : 1)
  const [countRow] = await db.select({ count: sql<number>`count(*)::int` }).from(auditLogs)
  const total = Number(countRow?.count ?? 0)
  const pages = Math.max(1, Math.ceil(total / safeLimit))
  const currentPage = Math.min(safePage, pages)
  const rows = await db.select().from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(safeLimit)
    .offset((currentPage - 1) * safeLimit)

  return { rows, total, page: currentPage, pages, limit: safeLimit }
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
