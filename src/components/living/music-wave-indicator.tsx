'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { useMusicState } from '@/hooks/use-music-state'
import type { Locale } from '@/i18n/config'
import { messages } from '@/i18n/messages'
import type { MusicLayerName } from '@/lib/music-state'

const layerOrder: MusicLayerName[] = ['bass','lowMid','mid','vocal','presence','air']
const phase: Record<MusicLayerName, number> = { bass:0.2, lowMid:1.1, mid:2.2, vocal:0.7, presence:2.9, air:4.1 }
const freq: Record<MusicLayerName, number> = { bass:1.2, lowMid:1.8, mid:2.6, vocal:1.6, presence:3.4, air:4.4 }

function pathFor(layer: MusicLayerName, weight: number, time: number, active: boolean) {
  if (!active) return 'M 4 12 L 108 12'
  const points = 42
  const amp = 1.2 + weight * (layer === 'vocal' ? 7 : 5.2)
  let path = 'M 4 12'
  for (let i=0;i<=points;i+=1) {
    const r=i/points, x=4+r*104, env=Math.sin(r*Math.PI)
    const y=12 + Math.sin(r*Math.PI*freq[layer] + time*.0038 + phase[layer]) * amp * env
    path += ` L ${x.toFixed(2)} ${y.toFixed(2)}`
  }
  return path
}

type Props = { locale: Locale }

export function MusicWaveIndicator({ locale }: Props) {
  const tooltipId = useId()
  const [open, setOpen] = useState(false)
  const [time, setTime] = useState(0)
  const state = useMusicState()
  const t = messages[locale].music.indicator
  const active = state.mode === 'listening' || state.mode === 'humming'
  useEffect(() => {
    if (!active) return
    let frame=0
    const tick=(ts:number) => { setTime(ts); frame=requestAnimationFrame(tick) }
    frame=requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active])

  const styleLabel = state.style ?? state.genre ?? 'unresolved'
  const modeLabel = t[state.mode]
  const title = state.track
    ? `${state.track.title} — ${state.track.artist}`
    : state.mode === 'humming' ? t.hummingTitle : t.title
  const detail = useMemo(() => {
    if (!state.connected) return `${t.resting} · ${t.notConnected}`
    if (state.mode === 'resting') return `${modeLabel} · LAST.FM READY`
    const bits=[styleLabel, state.arrangement, state.texture].filter(Boolean)
    return `${modeLabel} · ${bits.join(' · ')} · ${state.signal === 'dsp' ? 'LIVE DSP' : 'SEMANTIC · LAST.FM'}`
  }, [modeLabel, state, styleLabel, t])

  return (
    <div className="header-wave-wrap" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button className="header-wave" type="button" aria-label={`${title} · ${detail}`} aria-describedby={open ? tooltipId : undefined} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}>
        <svg viewBox="0 0 112 24" aria-hidden="true">
          <path d="M 4 12 L 108 12" className="header-wave-base" />
          {layerOrder.map(layer => (
            <path key={layer} d={pathFor(layer, state.layers[layer].weight, time, active)}
              className={`header-wave-layer header-wave-layer-${layer}${state.dominantLayer===layer ? ' is-dominant' : ''}`} />
          ))}
        </svg>
      </button>
      <div id={tooltipId} role="tooltip" data-open={open} className="header-wave-tooltip">
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
    </div>
  )
}
