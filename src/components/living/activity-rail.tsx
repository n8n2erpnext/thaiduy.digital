"use client"

import { useEffect, useState } from 'react'
import type { Locale } from '@/i18n/config'
import { messages } from '@/i18n/messages'

type SurfaceEvent = { at: string; source: string; state: string; type: string }
type Props = { locale: Locale }

export function ActivityRail({ locale }: Props) {
  const [events, setEvents] = useState<SurfaceEvent[]>([])
  const [connected, setConnected] = useState(false)
  const t = messages[locale].activity

  useEffect(() => {
    const stream = new EventSource('/api/entity/stream')
    const receive = (type: string) => (message: MessageEvent<string>) => {
      const payload = JSON.parse(message.data) as Omit<SurfaceEvent, 'type'>
      setEvents((current) => [{ ...payload, type }, ...current].slice(0, 3))
    }
    const ready = receive('surface.ready')
    const heartbeat = receive('surface.heartbeat')
    stream.addEventListener('surface.ready', ready as EventListener)
    stream.addEventListener('surface.heartbeat', heartbeat as EventListener)
    stream.onopen = () => setConnected(true)
    stream.onerror = () => setConnected(false)
    return () => stream.close()
  }, [])

  return (
    <section className="activity-rail" aria-label={t.aria}>
      <div className="activity-head"><span className="mini-kicker">{t.kicker}</span><strong data-live={connected}>{connected ? t.connected : t.connecting}</strong></div>
      <div className="activity-list">
        {events.map((item, index) => {
          const label = t.eventLabels[item.type as keyof typeof t.eventLabels] ?? item.type
          const stateLabel = t.stateLabels[item.state as keyof typeof t.stateLabels] ?? item.state
          return <div className="activity-row activity-row-live" key={`${item.at}-${item.type}-${index}`}>
            <time>{new Date(item.at).toLocaleTimeString(locale === 'vi' ? 'vi-VN' : 'en-GB', { hour12: false })}</time><span className="activity-dot" /><strong>{item.source}</strong><span>{label} · {stateLabel}</span>
          </div>
        })}
        {t.waiting.map(([source, state]) => <div className="activity-row" key={source}><time>--:--:--</time><span className="activity-dot" /><strong>{source}</strong><span>{state}</span></div>)}
      </div>
    </section>
  )
}
