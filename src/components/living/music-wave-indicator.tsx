'use client'

import { useId, useState } from 'react'
import type { MusicCortexState } from '@/lib/music-state'
import { restingMusicState } from '@/lib/music-state'

type Props = { state?: MusicCortexState }

export function MusicWaveIndicator({ state = restingMusicState }: Props) {
  const tooltipId = useId()
  const [open, setOpen] = useState(false)
  const label = state.connected
    ? state.mode === 'listening'
      ? `Sentinel Music Sensor · listening · ${state.style}`
      : state.mode === 'humming'
        ? `Sentinel Music Sensor · humming · ${state.mood}`
        : 'Sentinel Music Sensor · resting'
    : 'Sentinel Music Sensor · resting · sensor not connected'

  return (
    <div className="header-wave-wrap" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        className="header-wave"
        type="button"
        aria-label={label}
        aria-describedby={open ? tooltipId : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <svg viewBox="0 0 112 24" aria-hidden="true">
          <path d="M 4 12 L 108 12" className="header-wave-base" />
          <path d="M 18 12 C 28 11.4 34 12.6 44 12 C 54 11.4 60 12.6 70 12 C 80 11.5 86 12.5 96 12" className="header-wave-ghost" />
        </svg>
      </button>
      <div id={tooltipId} role="tooltip" data-open={open} className="header-wave-tooltip">
        <strong>{state.mode === 'humming' ? 'Sentinel is humming…' : 'Sentinel Music Sensor'}</strong>
        <span>{state.connected ? `${state.mode} · ${state.style}` : 'resting · sensor not connected'}</span>
      </div>
    </div>
  )
}
