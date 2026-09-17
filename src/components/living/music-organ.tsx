'use client'

import { useMemo } from 'react'
import { restingMusicState } from '@/lib/music-state'

const layers = ['bass','lowMid','mid','vocal','presence','air'] as const

export function MusicOrgan() {
  const state = restingMusicState
  const bars = useMemo(() => layers.map((layer, index) => ({
    layer, weight: state.layers[layer].weight, phase: index * 0.9,
  })), [state])

  return (
    <section className="music-organ" aria-label="Sentinel Music Sensor prototype">
      <div className="music-organ-head">
        <div><span className="mini-kicker">SENTINEL / MUSIC SENSOR</span><h3>Acoustic organ</h3></div>
        <span className="sensor-state">RESTING · NOT CONNECTED</span>
      </div>
      <div className="music-wave-shell" title="Sentinel Music Sensor is resting — live audio sensor is not connected yet.">
        <svg viewBox="0 0 620 124" role="img" aria-label="Resting music waveform">
          {bars.map((item, row) => {
            const y=20+row*17
            const amp=2 + item.weight*4
            let d=`M 0 ${y}`
            for (let i=0;i<=62;i+=1) {
              const x=i*10; const envelope=Math.sin((i/62)*Math.PI); const yy=y+Math.sin(i*.34+item.phase)*amp*envelope
              d += ` L ${x} ${yy.toFixed(2)}`
            }
            return <path key={item.layer} d={d} className={`music-layer music-layer-${item.layer}`} />
          })}
        </svg>
      </div>
      <div className="music-legend">{layers.map(layer => <span key={layer}><i />{layer}</span>)}</div>
      <p className="music-note">Renderer contract is ready. Genre, style, vocal prominence and realtime spectrum will come from Music Cortex — not from title heuristics.</p>
    </section>
  )
}
