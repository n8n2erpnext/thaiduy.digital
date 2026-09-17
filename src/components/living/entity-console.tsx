"use client"

import { useEffect, useMemo, useState } from 'react'
import { useMusicState } from '@/hooks/use-music-state'
import type { Locale } from '@/i18n/config'
import { messages } from '@/i18n/messages'
import { bootstrapEntityState } from '@/lib/entity-state'

const positions: Record<string, string> = {
  mb: 'node-mb', sentinel: 'node-sentinel', music: 'node-music',
  'light-remote': 'node-remote', lightbi: 'node-lightbi', n8n2erpnext: 'node-core',
}

type Props = { locale: Locale }

export function EntityConsole({ locale }: Props) {
  const [now, setNow] = useState<Date | null>(null)
  const t = messages[locale].entity
  const music = useMusicState()

  useEffect(() => {
    const initial = window.setTimeout(() => setNow(new Date()), 0)
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => { window.clearTimeout(initial); window.clearInterval(timer) }
  }, [])

  const time = useMemo(() => now?.toLocaleTimeString(locale === 'vi' ? 'vi-VN' : 'en-GB', { hour12: false }) ?? '--:--:--', [now, locale])

  return (
    <section className="entity-console" aria-label={t.aria}>
      <div className="console-topline"><span>{t.top}</span><span>{time}</span></div>
      <div className="entity-canvas">
        <div className="signal-ring signal-ring-one" /><div className="signal-ring signal-ring-two" />
        <div className="signal-axis signal-axis-x" /><div className="signal-axis signal-axis-y" />
        {bootstrapEntityState.nodes.map((node) => {
          const musicNode = node.id === 'music'
          const live = musicNode && music.connected
          return <article key={node.id} className={`entity-node ${positions[node.id]}${live ? ' is-connected' : ''}`}>
            <span className="node-led" /><strong>{node.label}</strong><small>{t.roles[node.id]}</small><em>{live ? `${music.mode.toUpperCase()} · ${(music.style ?? music.genre ?? 'SEMANTIC').toUpperCase()}` : t.notConnected}</em>
          </article>
        })}
        <div className="entity-heart" aria-hidden="true"><span /><span /><span /></div>
      </div>
      <div className="console-footer">
        {t.footer.map(([label, value], index) => <div key={label}><span className="console-label">{label}</span><strong>{index === 2 && music.connected ? (locale === 'vi' ? '1 KẾT NỐI' : '1 CONNECTED') : value}</strong></div>)}
      </div>
    </section>
  )
}
