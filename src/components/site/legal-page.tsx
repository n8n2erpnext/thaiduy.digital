import Link from 'next/link'
import type { Locale } from '@/i18n/config'
import type { LegalDocument } from '@/content/legal'
import { SiteHeader } from '@/components/site/header'

type Props = {
  locale: Locale
  document: LegalDocument
}

export function LegalPage({ locale, document }: Props) {
  const back=locale==='vi' ? 'Về trang chủ' : 'Back to home'
  return (
    <div className="site-shell">
      <SiteHeader locale={locale}/>
      <main className="legal-page">
        <header className="legal-hero">
          <p className="eyebrow">{document.eyebrow}</p>
          <h1>{document.title}</h1>
          <p className="legal-updated">{document.updated}</p>
          <p className="legal-intro">{document.intro}</p>
        </header>
        <div className="legal-body">
          {document.sections.map(section=>(
            <section key={section.title} className="legal-section">
              <h2>{section.title}</h2>
              {section.paragraphs.map((paragraph,index)=><p key={index}>{paragraph}</p>)}
              {section.bullets?.length ? (
                <ul>
                  {section.bullets.map(item=><li key={item}>{item}</li>)}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
        <Link className="text-action legal-back" href="/">{'← '+back}</Link>
      </main>
    </div>
  )
}
