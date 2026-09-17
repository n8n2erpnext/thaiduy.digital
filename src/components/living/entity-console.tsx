'use client'

import { useEffect, useMemo, useState } from 'react'

import { bootstrapEntityState } from '@/lib/entity-state'

const positions: Record<string, string> = {
  mb: 'node-mb',
  sentinel: 'node-sentinel',
  music: 'node-music',
  'light-remote': 'node-remote',
  lightbi: 'node-lightbi',
  n8n2erpnext: 'node-core',
}

export function EntityConsole() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    const initial = window.setTimeout(() => setNow(new Date()), 0)
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => {
      window.clearTimeout(initial)
      window.clearInterval(timer)
    }
  }, [])

  const time = useMemo(
    () => now?.toLocaleTimeString('en-GB', { hour12: false }) ?? '--:--:--',
    [now],
  )

  return (
    <section className="entity-console" aria-label="Living entity bootstrap console">
      <div className="console-topline">
        <span>ENTITY / LOCAL PROTOTYPE</span>
        <span>{time}</span>
      </div>

      <div className="entity-canvas">
        <div className="signal-ring signal-ring-one" />
        <div className="signal-ring signal-ring-two" />
        <div className="signal-axis signal-axis-x" />
        <div className="signal-axis signal-axis-y" />

        {bootstrapEntityState.nodes.map((node) => (
          <article key={node.id} className={`entity-node ${positions[node.id]}`}>
            <span className="node-led" />
            <strong>{node.label}</strong>
            <small>{node.role}</small>
            <em>not connected</em>
          </article>
        ))}

        <div className="entity-heart" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="console-footer">
        <div>
          <span className="console-label">STATE PLANE</span>
          <strong>BOOTSTRAP</strong>
        </div>
        <div>
          <span className="console-label">PUBLIC SIGNAL</span>
          <strong>AMBIENT ONLY</strong>
        </div>
        <div>
          <span className="console-label">LIVE SOURCES</span>
          <strong>0 CONNECTED</strong>
        </div>
      </div>
    </section>
  )
}
