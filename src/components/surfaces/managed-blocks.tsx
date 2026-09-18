import Link from 'next/link'
import { getPublishedRegistryChildren } from '@/content/repository'
import { metaText, textFor } from '@/content/types'
import type { Locale } from '@/i18n/config'

type Props = {
  locale: Locale
  parentKey: string
  empty?: string
}

export async function ManagedBlocks({ locale, parentKey, empty }: Props) {
  const items = await getPublishedRegistryChildren('section', parentKey)

  if (items.length === 0) {
    return empty ? <p>{empty}</p> : null
  }

  return (
    <section className="managed-block-grid" data-managed-parent={parentKey}>
      {items.map((item) => {
        const href = metaText(item.meta, 'href', locale)
        const badge = metaText(item.meta, 'badge', locale)
        const content = (
          <>
            <div className="managed-block-head">
              <span>{textFor(item.label, locale)}</span>
              {badge && <em>{badge}</em>}
            </div>
            <h2>{textFor(item.title, locale)}</h2>
            <p>{textFor(item.summary, locale)}</p>
            {href && <span className="managed-block-enter" aria-hidden="true">↗</span>}
          </>
        )

        return href ? (
          <Link className="managed-block" href={href} key={item.id} data-registry-key={item.key}>
            {content}
          </Link>
        ) : (
          <article className="managed-block" key={item.id} data-registry-key={item.key}>
            {content}
          </article>
        )
      })}
    </section>
  )
}
