"use client"

import { useMemo } from 'react'
import type { Locale } from '@/i18n/config'
import { messages } from '@/i18n/messages'
import { restingMusicState } from '@/lib/music-state'

const layers = ['bass','lowMid','mid','vocal','presence','air'] as const
type Props = { locale: Locale }

export function MusicOrgan({ locale }: Props) {
  const state = restingMusicState
  const t = messages[locale].music
  const bars = useMemo(() => layers.map((layer,index) => ({ layer, weight: state.layers[layer].weight, phase: index*.9 })), [state])

  return (
    <section className="music-organ" aria-label={t.aria}>
      <div className="music-organ-head"><div><span className="mini-kicker">{t.kicker}</span><h3>{t.title}</h3></div><span className="sensor-state">{t.state}</span></div>
      <div className="music-wave-shell" title={t.shellTitle}>
        <svg viewBox="0 0 620 124" role="img" aria-label={t.waveAria}>
          {bars.map((item,row) => {
            const y=20+row*17, amp=2+item.weight*4
            let d=`M 0 ${y}`
            for (let i=0;i<=62;i+=1) { const x=i*10, envelope=Math.sin((i/62)*Math.PI), yy=y+Math.sin(i*.34+item.phase)*amp*envelope; d += ` L ${x} ${yy.toFixed(2)}` }
            return <path key={item.layer} d={d} className={`music-layer music-layer-${item.layer}`} />
          })}
        </svg>
      </div>
      <div className="music-legend">{layers.map((layer) => <span key={layer}><i />{t.layers[layer]}</span>)}</div>
      <p className="music-note">{t.note}</p>
    </section>
  )
}
