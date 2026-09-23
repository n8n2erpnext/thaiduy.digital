import { randomBytes } from 'node:crypto'
import { and, eq, isNull } from 'drizzle-orm'
import { user } from '@/db/auth-schema'
import { db } from '@/db/client'
import { hubDevices } from '@/db/schema'
import { HUB_CONTROL_SCOPE } from '@/lib/hub-device-auth'
import { ensureRedis } from '@/lib/redis'

export const HUB_CONTROL_COOKIE = 'td_hub_control'
export const HUB_CONTROL_SESSION_TTL_SECONDS = 12 * 60 * 60
const HUB_CONTROL_TICKET_TTL_SECONDS = 30

type HubControlRecord = {
  deviceId:string
  ownerId:string
  email:string
}

function sessionKey(token:string) {
  return 'hub:control:session:'+token
}

function deviceKey(deviceId:string) {
  return 'hub:control:device:'+deviceId
}

function ticketKey(ticket:string) {
  return 'hub:control:ticket:'+ticket
}

async function ownerIdentity() {
  const ownerEmail=process.env.CONTROL_OWNER_EMAIL?.trim().toLowerCase()
  if (!ownerEmail) return null
  const [owner]=await db.select({ id:user.id, email:user.email }).from(user)
    .where(eq(user.email,ownerEmail)).limit(1)
  return owner ?? null
}

export async function issueHubControlTicket(deviceId:string) {
  const [device]=await db.select({
    id:hubDevices.id,
    scopes:hubDevices.scopes,
  }).from(hubDevices).where(and(
    eq(hubDevices.id,deviceId),
    eq(hubDevices.enabled,true),
    isNull(hubDevices.revokedAt),
  )).limit(1)
  if (!device || !device.scopes.includes(HUB_CONTROL_SCOPE)) return null

  const owner=await ownerIdentity()
  if (!owner) return null

  const ticket=randomBytes(24).toString('base64url')
  const redis=await ensureRedis()
  await redis.set(
    ticketKey(ticket),
    JSON.stringify({ deviceId, ownerId:owner.id, email:owner.email } satisfies HubControlRecord),
    'EX',
    HUB_CONTROL_TICKET_TTL_SECONDS,
  )
  return ticket
}

export async function consumeHubControlTicket(ticket:string) {
  const redis=await ensureRedis()
  const raw=await redis.call('GETDEL',ticketKey(ticket))
  if (!raw) return null

  let record:HubControlRecord
  try {
    record=JSON.parse(String(raw)) as HubControlRecord
  } catch {
    return null
  }

  const [device]=await db.select({
    id:hubDevices.id,
    scopes:hubDevices.scopes,
  }).from(hubDevices).where(and(
    eq(hubDevices.id,record.deviceId),
    eq(hubDevices.enabled,true),
    isNull(hubDevices.revokedAt),
  )).limit(1)
  if (!device || !device.scopes.includes(HUB_CONTROL_SCOPE)) return null

  const sessionToken=randomBytes(32).toString('base64url')
  const previous=await redis.get(deviceKey(record.deviceId))
  if (previous) await redis.del(sessionKey(previous))

  await redis.set(
    sessionKey(sessionToken),
    JSON.stringify(record),
    'EX',
    HUB_CONTROL_SESSION_TTL_SECONDS,
  )
  await redis.set(
    deviceKey(record.deviceId),
    sessionToken,
    'EX',
    HUB_CONTROL_SESSION_TTL_SECONDS,
  )

  return { token:sessionToken, record }
}

function cookieValue(cookieHeader:string | null,name:string) {
  if (!cookieHeader) return null
  for (const part of cookieHeader.split(';')) {
    const index=part.indexOf('=')
    if (index<0) continue
    if (part.slice(0,index).trim()!==name) continue
    return decodeURIComponent(part.slice(index+1).trim())
  }
  return null
}

export async function getHubControlIdentity(headers:Headers) {
  const token=cookieValue(headers.get('cookie'),HUB_CONTROL_COOKIE)
  if (!token) return null

  const redis=await ensureRedis()
  const raw=await redis.get(sessionKey(token))
  if (!raw) return null

  let record:HubControlRecord
  try {
    record=JSON.parse(raw) as HubControlRecord
  } catch {
    await redis.del(sessionKey(token))
    return null
  }

  const active=await redis.get(deviceKey(record.deviceId))
  if (active!==token) {
    await redis.del(sessionKey(token))
    return null
  }

  return {
    authSource:'hub' as const,
    deviceId:record.deviceId,
    user:{
      id:record.ownerId,
      email:record.email,
    },
  }
}

export async function clearHubControlSessionFromHeaders(headers:Headers) {
  const token=cookieValue(headers.get('cookie'),HUB_CONTROL_COOKIE)
  if (!token) return

  const redis=await ensureRedis()
  const raw=await redis.get(sessionKey(token))
  if (!raw) {
    await redis.del(sessionKey(token))
    return
  }

  try {
    const record=JSON.parse(raw) as HubControlRecord
    const active=await redis.get(deviceKey(record.deviceId))
    if (active===token) await redis.del(deviceKey(record.deviceId))
  } catch {
    // Malformed session data is treated as revoked.
  }
  await redis.del(sessionKey(token))
}

export async function revokeHubControlSession(deviceId:string) {
  const redis=await ensureRedis()
  const token=await redis.get(deviceKey(deviceId))
  if (token) await redis.del(sessionKey(token))
  await redis.del(deviceKey(deviceId))
}
