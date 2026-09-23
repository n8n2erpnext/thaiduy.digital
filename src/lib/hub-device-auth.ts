import { createHash, timingSafeEqual } from 'node:crypto'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/db/client'
import { hubDevices } from '@/db/schema'
import { ensureRedis } from '@/lib/redis'

export const MUSIC_SENSOR_SCOPE = 'music:sensor:write'
export const HUB_INBOX_SCOPE = 'hub:inbox:read'
export const HUB_CONTROL_SCOPE = 'hub:control:session'

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  return a.length === b.length && timingSafeEqual(a, b)
}

type HubDeviceIdentity = {
  id: string
  name: string
  scopes: string[]
}

export async function authenticateHubDevice(
  header: string | null,
  requiredScope?: string,
): Promise<HubDeviceIdentity | null> {
  const token = header?.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return null

  const legacy = process.env.MUSIC_SENSOR_INGEST_TOKEN
  if (legacy && safeEqual(token, legacy)) {
    const scopes = [MUSIC_SENSOR_SCOPE]
    if (requiredScope && !scopes.includes(requiredScope)) return null
    return { id:'legacy', name:'legacy-ingest', scopes }
  }

  const hash = sha256(token)
  const redis = await ensureRedis()
  const cacheKey = `hub:auth:${hash}`
  const cached = await redis.get(cacheKey)
  if (cached) {
    try {
      const device = JSON.parse(cached) as HubDeviceIdentity
      if (requiredScope && !device.scopes.includes(requiredScope)) return null
      return device
    } catch {
      await redis.del(cacheKey)
    }
  }

  const [device] = await db.select({
    id:hubDevices.id,
    name:hubDevices.name,
    scopes:hubDevices.scopes,
  }).from(hubDevices).where(and(
    eq(hubDevices.tokenHash, hash),
    eq(hubDevices.enabled, true),
    isNull(hubDevices.revokedAt),
  )).limit(1)
  if (!device) return null
  if (requiredScope && !device.scopes.includes(requiredScope)) return null

  await redis.set(cacheKey, JSON.stringify(device), 'EX', 300)
  const touch = await redis.set(`hub:lastseen:${device.id}`, '1', 'EX', 60, 'NX')
  if (touch === 'OK') {
    void db.update(hubDevices).set({ lastSeenAt:new Date(), updatedAt:new Date() })
      .where(eq(hubDevices.id, device.id))
  }
  return device
}

export function hubDeviceTokenHash(token: string) {
  return sha256(token)
}
