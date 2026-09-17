import type { Locale } from '@/i18n/config'
import { messages } from '@/i18n/messages'

type Props = { locale: Locale }

export function ProjectGrid({ locale }: Props) {
  const t = messages[locale].projectSurface
  return (
    <section className="project-grid" aria-label={t.aria}>
      {t.items.map((item, index) => (
        <article className="project-panel" key={item.id}>
          <div className="project-panel-head">
            <div>
              <span className="project-index">0{index + 1}</span>
              <h2>{item.name}</h2>
            </div>
            <span className="project-source">{t.sourceOff}</span>
          </div>
          <p className="project-role">{item.role}</p>
          <p className="project-summary">{item.summary}</p>
          <div className="project-runtime">
            <span>{t.runtime}</span>
            <strong>{t.notConnected}</strong>
          </div>
          <div className="project-signal" aria-hidden="true">
            <i /><i /><i /><i /><i />
          </div>
          <div className="project-meta">
            <span>{item.plane}</span>
            <span>{item.mode}</span>
          </div>
        </article>
      ))}
    </section>
  )
}
