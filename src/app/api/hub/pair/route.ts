import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/db/client'
import { auditLogs, hubDevices } from '@/db/schema'
import { ensureRedis } from '@/lib/redis'
import { hubDeviceTokenHash, MUSIC_SENSOR_SCOPE } from '@/lib/hub-device-auth'

const schema = z.object({
  code: z.string().regex(/^\d{6}$/),
  name: z.string().trim().min(1).max(96),
  platform: z.literal('android').default('android'),
})

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ paired:false }, { status:400 })
  }

  const redis = await ensureRedis()
  const pairKey = `hub:pair:${parsed.data.code}`
  const authorized = await redis.call('GETDEL', pairKey)
  if (!authorized) {
    return NextResponse.json({ paired:false }, { status:401 })
  }

  const token = randomBytes(32).toString('base64url')
  const tokenHash = hubDeviceTokenHash(token)
  const scopes = [MUSIC_SENSOR_SCOPE]
  const [device] = await db.insert(hubDevices).values({
    name:parsed.data.name,
    platform:parsed.data.platform,
    tokenHash,
    scopes,
  }).returning({ id:hubDevices.id, name:hubDevices.name, scopes:hubDevices.scopes })

  const current = await redis.get('hub:pair:current')
  if (current === parsed.data.code) await redis.del('hub:pair:current')
  await redis.set(
    `hub:auth:${tokenHash}`,
    JSON.stringify({ id:device.id, name:device.name, scopes:device.scopes }),
    'EX',
    300,
  )
  await db.insert(auditLogs).values({
    action:'hub_device.pair',
    entityType:'hub_device',
    entityId:device.id,
    metadata:{ name:device.name, platform:'android', scopes },
  })

  return NextResponse.json({
    paired:true,
    deviceId:device.id,
    token,
    scopes,
    ingestUrl:'https://thaiduy.digital/api/music/sensor/ingest',
    playbackUrl:'https://thaiduy.digital/api/hub/music/playback',
  }, { headers:{ 'Cache-Control':'no-store' } })
}
