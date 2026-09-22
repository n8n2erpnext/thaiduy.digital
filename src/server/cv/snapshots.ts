import 'server-only'

import { createHash, randomBytes } from 'node:crypto'
import { desc, eq } from 'drizzle-orm'
import { buildCvContent, type CvContent } from '@/content/cv'
import { db } from '@/db/client'
import { cvSnapshots } from '@/db/schema'
import type { Locale } from '@/i18n/config'

export type CvSnapshot = {
  id: string
  locale: Locale
  contentVersion: string
  contentHash: string
  content: CvContent
  issuedAt: Date
  revokedAt: Date | null
  revocationReason: string | null
}

function documentDay(date:Date) {
  return new Intl.DateTimeFormat('en-CA',{
    timeZone:'Asia/Ho_Chi_Minh',
    year:'numeric',
    month:'2-digit',
    day:'2-digit',
  }).format(date).replaceAll('-','')
}

export function createCvDocumentId(date=new Date()) {
  return `CV-${documentDay(date)}-${randomBytes(5).toString('hex').toUpperCase()}`
}

export function normalizeCvDocumentId(value:string) {
  return value.trim().toUpperCase()
}

export function isCvDocumentId(value:string) {
  return /^CV-\d{8}-[A-F0-9]{10}$/.test(normalizeCvDocumentId(value))
}

export function hashCvContent(locale:Locale,content:CvContent) {
  return createHash('sha256')
    .update(JSON.stringify({ locale, version:content.version, content }))
    .digest('hex')
}

function toSnapshot(row:typeof cvSnapshots.$inferSelect):CvSnapshot {
  return {
    id:row.id,
    locale:row.locale as Locale,
    contentVersion:row.contentVersion,
    contentHash:row.contentHash,
    content:row.content as unknown as CvContent,
    issuedAt:row.issuedAt,
    revokedAt:row.revokedAt,
    revocationReason:row.revocationReason,
  }
}

export async function issueCvSnapshot(locale:Locale):Promise<CvSnapshot> {
  const content=await buildCvContent(locale)
  const contentHash=hashCvContent(locale,content)

  for(let attempt=0;attempt<4;attempt+=1) {
    const id=createCvDocumentId()
    try {
      const [row]=await db.insert(cvSnapshots).values({
        id,
        locale,
        contentVersion:content.version,
        contentHash,
        content:content as unknown as Record<string,unknown>,
      }).returning()
      return toSnapshot(row)
    } catch (error) {
      if (attempt===3) throw error
    }
  }
  throw new Error('Unable to issue CV snapshot')
}

export async function getCvSnapshot(id:string):Promise<CvSnapshot|null> {
  const normalized=normalizeCvDocumentId(id)
  if (!isCvDocumentId(normalized)) return null
  const [row]=await db.select().from(cvSnapshots)
    .where(eq(cvSnapshots.id,normalized))
    .limit(1)
  return row?toSnapshot(row):null
}

export async function getLatestCvSnapshot():Promise<CvSnapshot|null> {
  const [row]=await db.select().from(cvSnapshots)
    .orderBy(desc(cvSnapshots.issuedAt))
    .limit(1)
  return row?toSnapshot(row):null
}

export function formatCvIssuedAt(date:Date,locale:Locale) {
  return new Intl.DateTimeFormat(locale==='vi'?'vi-VN':'en-GB',{
    timeZone:'Asia/Ho_Chi_Minh',
    year:'numeric',
    month:'2-digit',
    day:'2-digit',
    hour:'2-digit',
    minute:'2-digit',
    second:'2-digit',
    hour12:false,
  }).format(date)
}

export function shortCvFingerprint(hash:string) {
  return hash.slice(0,20).toUpperCase().match(/.{1,5}/g)?.join('-') ?? hash.slice(0,20).toUpperCase()
}
