import type { Locale } from '@/i18n/config'
import { messages } from '@/i18n/messages'

type Props = { locale: Locale }

const positions = [
  ['surface','50%','12%'], ['mesh','50%','38%'], ['arm','18%','70%'],
  ['amd','50%','76%'], ['desktop','82%','70%'], ['data','50%','96%'],
] as const

export function StackTopology({ locale }: Props) {
  const t = messages[locale].stackSurface
  const lookup = Object.fromEntries(t.nodes.map((node) => [node.id, node]))
  return (
    <section className="stack-surface" aria-label={t.aria}>
      <div className="stack-stage">
        <svg className="stack-links" viewBox="0 0 1000 620" aria-hidden="true" preserveAspectRatio="none">
          <path d="M500 85 C500 140 500 160 500 235" />
          <path d="M500 250 C390 300 270 330 180 430" />
          <path d="M500 250 C500 320 500 380 500 465" />
          <path d="M500 250 C610 300 730 330 820 430" />
          <path d="M180 445 C290 510 380 520 500 580" />
          <path d="M500 480 C500 520 500 540 500 580" />
          <path d="M820 445 C710 510 620 520 500 580" />
        </svg>
        {positions.map(([id,left,top]) => {
          const node = lookup[id]
          return (
            <article className={`stack-node stack-node-${id}`} style={{ left, top }} key={id}>
              <span className="stack-led" />
              <strong>{node.label}</strong>
              <small>{node.role}</small>
              <em>{t.notConnected}</em>
            </article>
          )
        })}
      </div>
      <div className="stack-legend">
        <span>{t.legend.public}</span>
        <span>{t.legend.private}</span>
        <span>{t.legend.safe}</span>
      </div>
      <p className="stack-note">{t.note}</p>
    </section>
  )
}
