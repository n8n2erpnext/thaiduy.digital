import { notFound } from 'next/navigation'
import { ContactChannel } from '@/components/about/contact-channel'
import { ManagedBlocks } from '@/components/surfaces/managed-blocks'
import { SectionPage } from '@/components/site/section-page'
import { resolveManagedSection } from '@/content/presentation'
import { resolveLocale } from '@/i18n/locale'
import { messages } from '@/i18n/messages'
import { createContactChallenge } from '@/server/contact/challenge'

export default async function Page() {
  const locale = await resolveLocale()
  const t = messages[locale]
  const section = await resolveManagedSection(
    'section.about',
    locale,
    t.sections.about,
  )
  if (!section.visible) notFound()
  const initialChallenge=createContactChallenge()

  return (
    <SectionPage
      locale={locale}
      eyebrow={section.eyebrow}
      title={section.title}
      copy={section.copy}
      managed={section.managed}
    >
      <>
        <ManagedBlocks locale={locale} parentKey="about" empty={t.section.empty} />
        <ContactChannel locale={locale} initialChallenge={initialChallenge} />
      </>
    </SectionPage>
  )
}
