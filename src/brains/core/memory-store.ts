import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { brainMemory, brainProfiles } from '@/db/schema'

export async function getBrainProfile(brainKey: string) {
  const [profile] = await db.select().from(brainProfiles)
    .where(eq(brainProfiles.brainKey, brainKey)).limit(1)
  return profile ?? null
}

export async function recallBrainMemory<T>(brainKey: string, hemisphere: string, memoryKey: string) {
  const [row] = await db.select().from(brainMemory).where(and(
    eq(brainMemory.brainKey, brainKey),
    eq(brainMemory.hemisphere, hemisphere),
    eq(brainMemory.memoryKey, memoryKey),
  )).limit(1)
  if (!row || (row.expiresAt && row.expiresAt.getTime() < Date.now())) return null
  return { value: row.value as T, confidence: row.confidence, learnedAt: row.learnedAt }
}

export async function rememberBrainMemory(input: {
  brainKey: string
  hemisphere: string
  memoryKey: string
  value: unknown
  confidence: number
  expiresAt?: Date | null
}) {
  await db.insert(brainMemory).values({ ...input }).onConflictDoUpdate({
    target: [brainMemory.brainKey, brainMemory.hemisphere, brainMemory.memoryKey],
    set: {
      value: input.value,
      confidence: input.confidence,
      learnedAt: new Date(),
      expiresAt: input.expiresAt ?? null,
    },
  })
}

export async function trimBrainMemory(brainKey: string, hemisphere: string, maxEntries: number) {
  const cap = Math.max(1, Math.min(100000, Math.floor(maxEntries)))
  await db.execute(sql`
    delete from brain_memory
    where id in (
      select id from brain_memory
      where brain_key = ${brainKey} and hemisphere = ${hemisphere}
      order by learned_at desc
      offset ${cap}
    )
  `)
}
