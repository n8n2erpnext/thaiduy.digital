'use client'

import { useEffect, useState } from 'react'

type SurfaceEvent = {
  at: string
  source: string
  state: string
  type: string
}

const waiting = [
  ['MB', 'semantic feed not connected'],
  ['SENTINEL', 'security feed not connected'],
  ['MUSIC SENSOR', 'acoustic feed not connected'],
] as const

export function ActivityRail() {
  const [events, setEvents] = useState<SurfaceEvent[]>([])
  const [connected, setConnected] = useState(false)

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
    <section className="activity-rail" aria-label="Live activity rail">
      <div className="activity-head">
        <span className="mini-kicker">ACTIVITY / LIVE TRANSPORT</span>
        <strong data-live={connected}>{connected ? 'SSE · CONNECTED' : 'SSE · CONNECTING'}</strong>
      </div>
      <div className="activity-list">
        {events.map((item, index) => (
          <div className="activity-row activity-row-live" key={`${item.at}-${item.type}-${index}`}>
            <time>{new Date(item.at).toLocaleTimeString('en-GB', { hour12: false })}</time>
            <span className="activity-dot" />
            <strong>{item.source}</strong>
            <span>{item.type} · {item.state}</span>
          </div>
        ))}
        {waiting.map(([source, state]) => (
          <div className="activity-row" key={source}>
            <time>--:--:--</time><span className="activity-dot" /><strong>{source}</strong><span>{state}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
