import Link from 'next/link'
import type { Locale } from '@/i18n/config'
import { messages } from '@/i18n/messages'
import { SiteHeader } from '@/components/site/header'

type Props = { locale: Locale; eyebrow: string; title: string; copy: string; managed?: boolean; children?: React.ReactNode }

export function SectionPage({ locale, eyebrow, title, copy, managed = false, children }: Props) {
  const t = messages[locale].section
  return (
    <div className="site-shell">
      <SiteHeader locale={locale} />
      <main className="section-page">
        <div className="section-page-copy">
          <p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{copy}</p>
          <div className="section-source"><span className="activity-dot" /><strong>{t.source}</strong><span>{managed ? t.managed : t.notConnected}</span></div>
        </div>
        <div className="section-page-body">{children ?? <p>{t.empty}</p>}</div>
        <Link className="text-action" href="/">← {t.back}</Link>
      </main>
    </div>
  )
}
