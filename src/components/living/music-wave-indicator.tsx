"use client"

import { useId, useState } from 'react'
import type { Locale } from '@/i18n/config'
import { messages } from '@/i18n/messages'
import type { MusicCortexState } from '@/lib/music-state'
import { restingMusicState } from '@/lib/music-state'

type Props = { locale: Locale; state?: MusicCortexState }

export function MusicWaveIndicator({ locale, state = restingMusicState }: Props) {
  const tooltipId = useId()
  const [open, setOpen] = useState(false)
  const t = messages[locale].music.indicator
  const modeLabel = t[state.mode]
  const label = state.connected
    ? state.mode === 'listening'
      ? `Sentinel Music Sensor · ${modeLabel} · ${state.style}`
      : state.mode === 'humming'
        ? `Sentinel Music Sensor · ${modeLabel} · ${state.mood}`
        : `Sentinel Music Sensor · ${modeLabel}`
    : `Sentinel Music Sensor · ${t.resting} · ${t.notConnected}`

  return (
    <div className="header-wave-wrap" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button className="header-wave" type="button" aria-label={label} aria-describedby={open ? tooltipId : undefined} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}>
        <svg viewBox="0 0 112 24" aria-hidden="true">
          <path d="M 4 12 L 108 12" className="header-wave-base" />
          <path d="M 18 12 C 28 11.4 34 12.6 44 12 C 54 11.4 60 12.6 70 12 C 80 11.5 86 12.5 96 12" className="header-wave-ghost" />
        </svg>
      </button>
      <div id={tooltipId} role="tooltip" data-open={open} className="header-wave-tooltip">
        <strong>{state.mode === 'humming' ? t.hummingTitle : t.title}</strong>
        <span>{state.connected ? `${modeLabel} · ${state.style}` : `${t.resting} · ${t.notConnected}`}</span>
      </div>
    </div>
  )
}
