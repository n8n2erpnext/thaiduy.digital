import { getRegistry } from '@/content/repository'
import { textFor } from '@/content/types'
import type { Locale } from '@/i18n/config'
import { messages } from '@/i18n/messages'

type Props = { locale: Locale }

export async function ProjectGrid({ locale }: Props) {
  const t = messages[locale].projectSurface
  const items = await getRegistry('project')
  return (
    <section className="project-grid" aria-label={t.aria}>
      {items.map((item, index) => (
        <article className="project-panel" key={item.id} data-registry-key={item.key}>
          <div className="project-panel-head"><div><span className="project-index">{String(index + 1).padStart(2,'0')}</span><h2>{textFor(item.label, locale)}</h2></div><span className="project-source">{t.sourceOff}</span></div>
          <p className="project-role">{textFor(item.title, locale)}</p>
          <p className="project-summary">{textFor(item.summary, locale)}</p>
          <div className="project-runtime"><span>{t.runtime}</span><strong>{t.notConnected}</strong></div>
          <div className="project-signal" aria-hidden="true"><i /><i /><i /><i /><i /></div>
          <div className="project-meta"><span>{String(item.meta?.plane ?? '')}</span><span>{String(item.meta?.mode ?? '')}</span></div>
        </article>
      ))}
    </section>
  )
}
