import 'server-only'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { siteSettings } from '@/db/schema'
import type { Locale } from '@/i18n/config'

export type SiteIdentity = {
  name?: string
  domain?: string
  lab?: Partial<Record<Locale, string>>
}

export type SiteMeta = {
  title?: Partial<Record<Locale, string>>
  description?: Partial<Record<Locale, string>>
}

export async function getSiteSetting<T>(key: string, fallback: T): Promise<T> {
  const [row] = await db.select({ value:siteSettings.value })
    .from(siteSettings)
    .where(eq(siteSettings.key, key))
    .limit(1)

  return (row?.value as T | undefined) ?? fallback
}
