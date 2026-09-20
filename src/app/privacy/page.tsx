import type { Metadata } from 'next'
import { LegalPage } from '@/components/site/legal-page'
import { getLegalDocument } from '@/content/legal'
import { resolveLocale } from '@/i18n/locale'

export async function generateMetadata():Promise<Metadata> {
  const locale=await resolveLocale()
  const document=getLegalDocument('privacy',locale)
  return { title:document.title+' — Thái Duy', description:document.intro }
}

export default async function PrivacyPage() {
  const locale=await resolveLocale()
  return <LegalPage locale={locale} document={getLegalDocument('privacy',locale)}/>
}
