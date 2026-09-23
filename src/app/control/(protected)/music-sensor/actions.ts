'use server'

import { randomInt } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db/client'
import { auditLogs, hubDevices, revisions } from '@/db/schema'
import { requireControlOwner } from '@/lib/control-auth'
import { revokeHubControlSession } from '@/lib/hub-control-session'
import { ensureRedis } from '@/lib/redis'

export async function createMusicSensorPairCodeAction() {
  const session = await requireControlOwner()
  const redis = await ensureRedis()

  let code = ''
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = String(randomInt(100000, 1000000))
    const ok = await redis.set(`hub:pair:${candidate}`, session.user.id, 'EX', 300, 'NX')
    if (ok === 'OK') { code = candidate; break }
  }
  if (!code) throw new Error('pair_code_unavailable')

  await redis.set('hub:pair:current', code, 'EX', 300)
  await db.insert(auditLogs).values({
    actorId:session.user.id,
    action:'hub_device.pair_code.create',
    entityType:'hub_device_pairing',
    entityId:code,
    metadata:{ ttlSeconds:300 },
  })
  revalidatePath('/control/music-sensor')
}

export async function revokeHubDeviceAction(formData: FormData) {
  const session = await requireControlOwner()
  const id = z.uuid().parse(String(formData.get('id') ?? ''))
  const redis = await ensureRedis()

  const revokedTokenHash = await db.transaction(async tx => {
    const [before] = await tx.select().from(hubDevices)
      .where(eq(hubDevices.id, id)).limit(1)
    if (!before) return null

    const [after] = await tx.update(hubDevices).set({
      enabled:false,
      revokedAt:new Date(),
      updatedAt:new Date(),
    }).where(eq(hubDevices.id, id)).returning()

    await tx.insert(revisions).values({
      entityType:'hub_device',
      entityId:id,
      action:'revoke',
      before,
      after,
      actorId:session.user.id,
    })
    await tx.insert(auditLogs).values({
      actorId:session.user.id,
      action:'hub_device.revoke',
      entityType:'hub_device',
      entityId:id,
      metadata:{ name:before.name, scopes:before.scopes },
    })
    return before.tokenHash
  })

  if (revokedTokenHash) {
    await redis.del(
      `hub:auth:${revokedTokenHash}`,
      `hub:lastseen:${id}`,
    )
    await revokeHubControlSession(id)
  }
  revalidatePath('/control/music-sensor')
}
