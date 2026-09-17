'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMusicState } from '@/hooks/use-music-state'
import type { Locale } from '@/i18n/config'
import { messages } from '@/i18n/messages'

const layers = ['bass','lowMid','mid','vocal','presence','air'] as const
type Props = { locale: Locale }

export function MusicOrgan({ locale }: Props) {
  const state = useMusicState()
  const [time,setTime] = useState(0)
  const t = messages[locale].music
  const active = state.mode !== 'resting'
  const bars = useMemo(() => layers.map((layer,index) => ({ layer, weight:state.layers[layer].weight, phase:index*.9 })), [state.layers])

  useEffect(() => {
    if (!active) return
    let frame=0
    const tick=(ts:number) => { setTime(ts); frame=requestAnimationFrame(tick) }
    frame=requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active])

  const status = !state.connected ? (locale==='vi' ? 'CHƯA KẾT NỐI' : 'NOT CONNECTED')
    : state.mode==='listening' ? (state.signal==='dsp' ? 'LISTENING · LIVE DSP' : 'LISTENING · SEMANTIC')
    : state.mode==='humming' ? 'HUMMING' : 'RESTING · LAST.FM READY'
  const note = state.track ? `${state.track.title} — ${state.track.artist}` : t.note
  return (
    <section className="music-organ" aria-label={t.aria}>
      <div className="music-organ-head"><div><span className="mini-kicker">{t.kicker}</span><h3>{t.title}</h3></div><span className="sensor-state">{status}</span></div>
      <div className="music-wave-shell" title={note}>
        <svg viewBox="0 0 620 124" role="img" aria-label={t.waveAria}>
          {bars.map((item,row) => {
            const y=20+row*17, amp=active ? 2+item.weight*7 : .4
            let d=`M 0 ${y}`
            for (let i=0;i<=62;i+=1) { const x=i*10, envelope=Math.sin((i/62)*Math.PI), yy=y+Math.sin(i*.34+item.phase+time*.0015)*amp*envelope; d += ` L ${x} ${yy.toFixed(2)}` }
            return <path key={item.layer} d={d} className={`music-layer music-layer-${item.layer}${state.dominantLayer===item.layer?' is-dominant':''}`} />
          })}
        </svg>
      </div>
      <div className="music-legend">{layers.map((layer) => <span key={layer}><i />{t.layers[layer]}</span>)}</div>
      <p className="music-note">{note}</p>
      {state.track && <p className="music-note">{[state.genre,state.style,state.arrangement,state.texture].filter(Boolean).join(' · ')}</p>}
    </section>
  )
}
