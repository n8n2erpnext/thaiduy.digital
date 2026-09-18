import 'server-only'
import { eq, inArray } from 'drizzle-orm'
import { db } from '@/db/client'
import { featureFlags } from '@/db/schema'

export async function isFeatureEnabled(key: string, fallback = false) {
  const [row] = await db.select({ enabled:featureFlags.enabled })
    .from(featureFlags)
    .where(eq(featureFlags.key, key))
    .limit(1)
  return row?.enabled ?? fallback
}

export async function getFeatureState(
  keys: readonly string[],
  fallback = false,
) {
  if (keys.length === 0) return {} as Record<string, boolean>

  const rows = await db.select({
    key:featureFlags.key,
    enabled:featureFlags.enabled,
  }).from(featureFlags).where(inArray(featureFlags.key, [...keys]))

  const state: Record<string, boolean> = Object.fromEntries(
    keys.map(key => [key, fallback]),
  )
  for (const row of rows) state[row.key] = row.enabled
  return state
}
