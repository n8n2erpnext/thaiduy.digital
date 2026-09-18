import { notFound } from 'next/navigation'
import { ManagedBlocks } from '@/components/surfaces/managed-blocks'
import { SectionPage } from '@/components/site/section-page'
import { resolveManagedSection } from '@/content/presentation'
import { resolveLocale } from '@/i18n/locale'
import { messages } from '@/i18n/messages'

export default async function Page() {
  const locale = await resolveLocale()
  const t = messages[locale]
  const section = await resolveManagedSection(
    'section.writing',
    locale,
    t.sections.writing,
  )
  if (!section.visible) notFound()

  return (
    <SectionPage
      locale={locale}
      eyebrow={section.eyebrow}
      title={section.title}
      copy={section.copy}
      managed={section.managed}
    >
      <ManagedBlocks locale={locale} parentKey="writing" empty={t.section.empty} />
    </SectionPage>
  )
}
