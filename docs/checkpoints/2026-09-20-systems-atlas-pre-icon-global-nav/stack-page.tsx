import { notFound } from 'next/navigation'
import { StackSpatial } from '@/components/stack/stack-spatial'
import { SiteHeader } from '@/components/site/header'
import { resolveManagedSection } from '@/content/presentation'
import { resolveLocale } from '@/i18n/locale'
import { messages } from '@/i18n/messages'
import { getLivePublicStackGraph } from '@/server/stack/public'

export default async function Page() {
  const locale = await resolveLocale()
  const t = messages[locale]
  const section = await resolveManagedSection(
    'section.stack',
    locale,
    t.sections.stack,
  )
  if (!section.visible) notFound()

  const { graph } = await getLivePublicStackGraph()

  return (
    <div className="site-shell stack-page">
      <SiteHeader locale={locale} />
      <main>
        <StackSpatial initialGraph={graph} locale={locale} />
      </main>
    </div>
  )
}
