import { StackTopology } from '@/components/surfaces/stack-topology'
import { SectionPage } from '@/components/site/section-page'
import { resolveLocale } from '@/i18n/locale'
import { messages } from '@/i18n/messages'

export default async function Page() {
  const locale = await resolveLocale()
  const t = messages[locale].sections.stack
  return (
    <SectionPage locale={locale} eyebrow={t.eyebrow} title={t.title} copy={t.copy}>
      <StackTopology locale={locale} />
    </SectionPage>
  )
}
