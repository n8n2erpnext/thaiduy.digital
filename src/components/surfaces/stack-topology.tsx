import { getRegistry } from '@/content/repository'
import { textFor } from '@/content/types'
import type { Locale } from '@/i18n/config'
import { messages } from '@/i18n/messages'

type Props = { locale: Locale }

export async function StackTopology({ locale }: Props) {
  const t = messages[locale].stackSurface
  const nodes = await getRegistry('stack-node')
  return (
    <section className="stack-surface" aria-label={t.aria}>
      <div className="stack-stage">
        <svg className="stack-links" viewBox="0 0 1000 620" aria-hidden="true" preserveAspectRatio="none">
          <path d="M500 85 C500 140 500 160 500 235"/><path d="M500 250 C390 300 270 330 180 430"/><path d="M500 250 C500 320 500 380 500 465"/><path d="M500 250 C610 300 730 330 820 430"/><path d="M180 445 C290 510 380 520 500 580"/><path d="M500 480 C500 520 500 540 500 580"/><path d="M820 445 C710 510 620 520 500 580"/>
        </svg>
        {nodes.map((node) => {
          const left=String(node.meta?.x ?? '50%'), top=String(node.meta?.y ?? '50%')
          return <article className={`stack-node stack-node-${node.key}`} style={{ left, top }} key={node.id} data-registry-key={node.key}><span className="stack-led"/><strong>{textFor(node.label, locale)}</strong><small>{textFor(node.title, locale)}</small><em>{t.notConnected}</em></article>
        })}
      </div>
      <div className="stack-legend"><span>{t.legend.public}</span><span>{t.legend.private}</span><span>{t.legend.safe}</span></div>
      <p className="stack-note">{t.note}</p>
    </section>
  )
}
