'use server'

import { randomInt } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db/client'
import { auditLogs, musicSensorDevices, revisions } from '@/db/schema'
import { requireControlOwner } from '@/lib/control-auth'
import { ensureRedis } from '@/lib/redis'

export async function createMusicSensorPairCodeAction() {
  const session = await requireControlOwner()
  const redis = await ensureRedis()

  let code = ''
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = String(randomInt(100000, 1000000))
    const ok = await redis.set(`music:sensor:pair:${candidate}`, session.user.id, 'EX', 300, 'NX')
    if (ok === 'OK') { code = candidate; break }
  }
  if (!code) throw new Error('pair_code_unavailable')

  await redis.set('music:sensor:pair:current', code, 'EX', 300)

  await db.insert(auditLogs).values({
    actorId:session.user.id,
    action:'music_sensor.pair_code.create',
    entityType:'music_sensor_pairing',
    entityId:code,
    metadata:{ ttlSeconds:300 },
  })
  revalidatePath('/control/music-sensor')
}

export async function revokeMusicSensorAction(formData: FormData) {
  const session = await requireControlOwner()
  const id = z.uuid().parse(String(formData.get('id') ?? ''))

  await db.transaction(async tx => {
    const [before] = await tx.select().from(musicSensorDevices)
      .where(eq(musicSensorDevices.id, id)).limit(1)
    if (!before) return

    const [after] = await tx.update(musicSensorDevices).set({
      enabled:false,
      revokedAt:new Date(),
      updatedAt:new Date(),
    }).where(eq(musicSensorDevices.id, id)).returning()

    await tx.insert(revisions).values({
      entityType:'music_sensor_device',
      entityId:id,
      action:'revoke',
      before,
      after,
      actorId:session.user.id,
    })
    await tx.insert(auditLogs).values({
      actorId:session.user.id,
      action:'music_sensor.revoke',
      entityType:'music_sensor_device',
      entityId:id,
      metadata:{ name:before.name },
    })
  })
  revalidatePath('/control/music-sensor')
}
