import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { eq, sql } from 'drizzle-orm'
import { isbot } from 'isbot'
import { UAParser } from 'ua-parser-js'
import { z } from 'zod'
import { db } from '@/db/client'
import { featureFlags, trafficEvents, trafficSessions } from '@/db/schema'
import { ensureRedis } from '@/lib/redis'

const payloadSchema = z.object({
  type: z.enum(['pageview', 'event', 'performance']).default('pageview'),
  name: z.string().trim().min(1).max(160).optional(),
  url: z.string().max(2048),
  referrer: z.string().max(2048).optional(),
  title: z.string().max(512).optional(),
  language: z.string().max(32).optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
  lcp: z.number().min(0).max(60000).optional(),
  inp: z.number().min(0).max(60000).optional(),
  cls: z.number().min(0).max(100).optional(),
  fcp: z.number().min(0).max(60000).optional(),
  ttfb: z.number().min(0).max(60000).optional(),
})

const SID = 'td_sid'
const VID = 'td_vid'
const RATE_WINDOW_SECONDS = 60
const RATE_MAX_EVENTS = 180

function analyticsClientKey(request:NextRequest) {
  const value=request.headers.get('cf-connecting-ip')
    ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown'
  return createHash('sha256').update(value).digest('hex').slice(0,24)
}

async function analyticsRateAllowed(request:NextRequest) {
  try {
    const redis=await ensureRedis()
    const key='analytics:rate:'+analyticsClientKey(request)
    const count=Number(await redis.incr(key))
    if (count===1) await redis.expire(key,RATE_WINDOW_SECONDS)
    return count<=RATE_MAX_EVENTS
  } catch {
    return true
  }
}
function validUuid(value?: string) {
  return value && z.uuid().safeParse(value).success ? value : crypto.randomUUID()
}

function referrerDomain(referrer: string | undefined, host: string) {
  if (!referrer) return null
  try {
    const value = new URL(referrer, `https://${host}`).hostname.replace(/^www\./, '').toLowerCase()
    const current = host.replace(/^www\./, '').split(':')[0].toLowerCase()
    return value && value !== current ? value : null
  } catch {
    return null
  }
}

function deviceLabel(type?: string) {
  if (!type) return 'desktop'
  if (type === 'mobile') return 'mobile'
  if (type === 'tablet') return 'tablet'
  return type.slice(0, 40)
}

async function enabled() {
  const [row] = await db.select({ enabled: featureFlags.enabled }).from(featureFlags)
    .where(eq(featureFlags.key, 'traffic.analytics')).limit(1)
  return row?.enabled ?? false
}

export async function POST(request: NextRequest) {
  if (!(await enabled())) return NextResponse.json({ accepted: false }, { status: 202 })
  const userAgent = request.headers.get('user-agent') ?? ''
  if (!userAgent || isbot(userAgent)) return NextResponse.json({ accepted: false }, { status: 202 })
  if (!await analyticsRateAllowed(request)) {
    return NextResponse.json(
      { accepted:false },
      { status:429, headers:{ 'Retry-After':String(RATE_WINDOW_SECONDS) } },
    )
  }
  let parsed: z.infer<typeof payloadSchema>
  try {
    parsed = payloadSchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }
  if (parsed.type === 'event' && !parsed.name) {
    return NextResponse.json({ error: 'event_name_required' }, { status: 400 })
  }
  if (JSON.stringify(parsed.properties ?? {}).length > 8192) {
    return NextResponse.json({ error: 'properties_too_large' }, { status: 413 })
  }

  const current = new URL(parsed.url, request.nextUrl.origin)
  if (current.pathname.startsWith('/control') || current.pathname.startsWith('/api')) {
    return NextResponse.json({ accepted: false }, { status: 202 })
  }

  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? current.host
  const sid = validUuid(request.cookies.get(SID)?.value)
  const vid = validUuid(request.cookies.get(VID)?.value)
  const ua = UAParser(userAgent)
  const country = (request.headers.get('cf-ipcountry') ?? request.headers.get('x-vercel-ip-country') ?? '').slice(0, 8) || null
  const language = parsed.language?.slice(0, 32) || request.headers.get('accept-language')?.split(',')[0]?.slice(0, 32) || null
  const browser = ua.browser.name?.slice(0, 80) || null
  const os = ua.os.name?.slice(0, 80) || null
  const device = deviceLabel(ua.device.type)
  const referrer = referrerDomain(parsed.referrer, host)
  const now = new Date()
  const views = parsed.type === 'pageview' ? 1 : 0
  const events = parsed.type === 'event' ? 1 : 0
  await db.transaction(async tx => {
    await tx.insert(trafficSessions).values({
      id: sid,
      firstAt: now,
      lastAt: now,
      landingPath: current.pathname,
      referrerDomain: referrer,
      country,
      language,
      browser,
      os,
      device,
      views,
      events,
    }).onConflictDoUpdate({
      target: trafficSessions.id,
      set: {
        lastAt: now,
        country,
        language,
        browser,
        os,
        device,
        views: sql`${trafficSessions.views} + ${views}`,
        events: sql`${trafficSessions.events} + ${events}`,
      },
    })

    await tx.insert(trafficEvents).values({
      sessionId: sid,
      visitId: vid,
      type: parsed.type,
      name: parsed.name,
      path: current.pathname,
      query: current.search.slice(1) || null,
      title: parsed.title,
      referrerDomain: referrer,
      country,
      language,
      browser,
      os,
      device,
      utmSource: current.searchParams.get('utm_source'),
      utmMedium: current.searchParams.get('utm_medium'),
      utmCampaign: current.searchParams.get('utm_campaign'),
      utmContent: current.searchParams.get('utm_content'),
      utmTerm: current.searchParams.get('utm_term'),
      properties: parsed.properties ?? {},
      lcp: parsed.lcp,
      inp: parsed.inp,
      cls: parsed.cls,
      fcp: parsed.fcp,
      ttfb: parsed.ttfb,
      createdAt: now,
    })
  })

  try {
    const client = await ensureRedis()
    const key = 'analytics:active'
    const ts = Date.now()
    await client.zadd(key, ts, sid)
    await client.zremrangebyscore(key, 0, ts - 5 * 60 * 1000)
    await client.expire(key, 60 * 60)
  } catch {
    // Analytics durability lives in Postgres; realtime presence may fail independently.
  }
  const response = NextResponse.json({ accepted: true }, { status: 202 })
  const secure = process.env.NODE_ENV === 'production'
  response.cookies.set(SID, sid, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 365 * 24 * 60 * 60,
  })
  response.cookies.set(VID, vid, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 30 * 60,
  })
  return response
}
