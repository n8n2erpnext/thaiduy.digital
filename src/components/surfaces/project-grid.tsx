import Link from 'next/link'
import { getRegistry } from '@/content/repository'
import { textFor } from '@/content/types'
import type { Locale } from '@/i18n/config'
import { messages } from '@/i18n/messages'
import { getLivePublicStackGraph } from '@/server/stack/public'
import { projectRuntimeFromStack } from '@/server/stack/projection'

type Props = { locale: Locale }

function initials(value:string) {
  return value.split(/\s+/).filter(Boolean).slice(0,2).map(part => part[0]).join('').toUpperCase()
}

export async function ProjectGrid({ locale }: Props) {
  const t = messages[locale].projectSurface
  const [items, liveStack] = await Promise.all([
    getRegistry('project'),
    getLivePublicStackGraph(),
  ])
  const runtime = await projectRuntimeFromStack(liveStack.graph)

  return (
    <section className="project-grid" aria-label={t.aria}>
      {items.map((item, index) => {
        const state = runtime[item.key]
        const stateKey = state?.state ?? 'offline'
        const stateLabel = t.states[stateKey]
        const connected = !!state && state.matchedCount > 0
        const label = textFor(item.label, locale)
        const logoUrl = String(item.meta?.logoUrl ?? '')

        return (
          <Link
            className="project-panel"
            href={'/projects/' + item.key}
            key={item.id}
            data-registry-key={item.key}
            data-runtime-state={stateKey}
            aria-label={(locale === 'vi' ? 'Xem dự án ' : 'View project ') + label}
          >
            <div className="project-panel-head">
              <div className="project-panel-identity">
                <div className="project-mark" aria-hidden="true">
                  {logoUrl
                    ? <img src={logoUrl} alt="" />
                    : <span>{initials(label)}</span>}
                </div>
                <div>
                  <span className="project-index">{String(index + 1).padStart(2,'0')}</span>
                  <h2>{label}</h2>
                </div>
              </div>
              <span className="project-source">{connected ? t.sourceLive : t.sourceOff}</span>
            </div>

            <p className="project-role">{textFor(item.title, locale)}</p>
            <p className="project-summary">{textFor(item.summary, locale)}</p>

            <div className="project-runtime">
              <span>{t.runtime}</span>
              <strong>{stateLabel}</strong>
            </div>

            <div className="project-signal" aria-hidden="true">
              <i /><i /><i /><i /><i />
            </div>

            <div className="project-meta">
              <span>{String(item.meta?.plane ?? '')}</span>
              <span>{String(item.meta?.mode ?? '')}</span>
              {state && <span>{state.matchedCount} NODES</span>}
            </div>

            <span className="project-enter">
              {locale === 'vi' ? 'XEM DỰ ÁN →' : 'VIEW PROJECT →'}
            </span>
          </Link>
        )
      })}
    </section>
  )
}
