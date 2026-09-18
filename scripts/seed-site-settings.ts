import { db, sqlClient } from '../src/db/client'
import { siteSettings } from '../src/db/schema'
import { eq } from 'drizzle-orm'
import { messages } from '../src/i18n/messages'

const [identityRow] = await db.select({ value:siteSettings.value })
  .from(siteSettings)
  .where(eq(siteSettings.key, 'site.identity'))
  .limit(1)

const currentIdentity = (
  identityRow?.value &&
  typeof identityRow.value === 'object' &&
  !Array.isArray(identityRow.value)
) ? identityRow.value as Record<string, unknown> : {}

const nextIdentity = {
  ...currentIdentity,
  name: typeof currentIdentity.name === 'string' ? currentIdentity.name : 'Thái Duy',
  domain: typeof currentIdentity.domain === 'string' ? currentIdentity.domain : 'thaiduy.digital',
  lab: currentIdentity.lab ?? {
    en: messages.en.header.lab,
    vi: messages.vi.header.lab,
  },
}

await db.insert(siteSettings).values({
  key:'site.identity',
  value:nextIdentity,
  updatedBy:'bootstrap',
  updatedAt:new Date(),
}).onConflictDoUpdate({
  target:siteSettings.key,
  set:{
    value:nextIdentity,
    updatedBy:'bootstrap',
    updatedAt:new Date(),
  },
})

await db.insert(siteSettings).values({
  key:'site.meta',
  value:{
    title:{
      en:messages.en.meta.title,
      vi:messages.vi.meta.title,
    },
    description:{
      en:messages.en.meta.description,
      vi:messages.vi.meta.description,
    },
  },
  updatedBy:'bootstrap',
  updatedAt:new Date(),
}).onConflictDoNothing({ target:siteSettings.key })

console.log('site_settings_seeded=true')
await sqlClient.end()
