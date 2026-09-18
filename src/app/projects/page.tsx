import { notFound } from 'next/navigation'
import { ProjectGrid } from '@/components/surfaces/project-grid'
import { SectionPage } from '@/components/site/section-page'
import { resolveManagedSection } from '@/content/presentation'
import { resolveLocale } from '@/i18n/locale'
import { messages } from '@/i18n/messages'

export default async function Page() {
  const locale = await resolveLocale()
  const t = messages[locale]
  const section = await resolveManagedSection(
    'section.projects',
    locale,
    t.sections.projects,
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
      <ProjectGrid locale={locale} />
    </SectionPage>
  )
}
