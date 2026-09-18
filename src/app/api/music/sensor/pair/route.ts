import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/db/client'
import { auditLogs, musicSensorDevices } from '@/db/schema'
import { ensureRedis } from '@/lib/redis'
import { musicSensorTokenHash } from '@/lib/music-sensor-auth'

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
  const pairKey = `music:sensor:pair:${parsed.data.code}`
  const authorized = await redis.call('GETDEL', pairKey)
  if (!authorized) {
    return NextResponse.json({ paired:false }, { status:401 })
  }

  const token = randomBytes(32).toString('base64url')
  const tokenHash = musicSensorTokenHash(token)
  const [device] = await db.insert(musicSensorDevices).values({
    name:parsed.data.name,
    platform:parsed.data.platform,
    tokenHash,
  }).returning({ id:musicSensorDevices.id, name:musicSensorDevices.name })

  const current = await redis.get('music:sensor:pair:current')
  if (current === parsed.data.code) await redis.del('music:sensor:pair:current')
  await redis.set(`music:sensor:auth:${tokenHash}`, device.id, 'EX', 300)
  await db.insert(auditLogs).values({
    action:'music_sensor.pair',
    entityType:'music_sensor_device',
    entityId:device.id,
    metadata:{ name:device.name, platform:'android' },
  })

  return NextResponse.json({
    paired:true,
    deviceId:device.id,
    token,
    ingestUrl:'https://thaiduy.digital/api/music/sensor/ingest',
  }, { headers:{ 'Cache-Control':'no-store' } })
}
