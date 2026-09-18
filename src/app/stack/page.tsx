import { notFound } from 'next/navigation'
import { StackTopology } from '@/components/surfaces/stack-topology'
import { SectionPage } from '@/components/site/section-page'
import { resolveManagedSection } from '@/content/presentation'
import { resolveLocale } from '@/i18n/locale'
import { messages } from '@/i18n/messages'

export default async function Page() {
  const locale = await resolveLocale()
  const t = messages[locale]
  const section = await resolveManagedSection(
    'section.stack',
    locale,
    t.sections.stack,
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
      <StackTopology locale={locale} />
    </SectionPage>
  )
}
