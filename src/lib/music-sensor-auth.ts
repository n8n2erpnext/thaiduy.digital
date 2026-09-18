import { createHash, timingSafeEqual } from 'node:crypto'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/db/client'
import { musicSensorDevices } from '@/db/schema'
import { ensureRedis } from '@/lib/redis'

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function authenticateMusicSensor(header: string | null) {
  const token = header?.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return null

  const legacy = process.env.MUSIC_SENSOR_INGEST_TOKEN
  if (legacy && safeEqual(token, legacy)) return { id:'legacy', name:'legacy-ingest' }

  const hash = sha256(token)
  const redis = await ensureRedis()

  const cached = await redis.get(`music:sensor:auth:${hash}`)
  if (cached) return { id:cached, name:'paired-device' }

  const [device] = await db.select({
    id:musicSensorDevices.id,
    name:musicSensorDevices.name,
  }).from(musicSensorDevices).where(and(
    eq(musicSensorDevices.tokenHash, hash),
    eq(musicSensorDevices.enabled, true),
    isNull(musicSensorDevices.revokedAt),
  )).limit(1)
  if (!device) return null

  await redis.set(`music:sensor:auth:${hash}`, device.id, 'EX', 300)
  const touch = await redis.set(`music:sensor:lastseen:${device.id}`, '1', 'EX', 60, 'NX')
  if (touch === 'OK') {
    void db.update(musicSensorDevices).set({ lastSeenAt:new Date(), updatedAt:new Date() })
      .where(eq(musicSensorDevices.id, device.id))
  }
  return device
}

export function musicSensorTokenHash(token: string) {
  return sha256(token)
}
