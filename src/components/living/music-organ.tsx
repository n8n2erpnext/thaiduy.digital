'use client'

import Link from 'next/link'
import { useEffect,useMemo,useState } from 'react'
import { useMusicState } from '@/hooks/use-music-state'
import type { Locale } from '@/i18n/config'
import { messages } from '@/i18n/messages'
import {
  liveDspLayerColors,
  liveDspWavePath,
} from '@/lib/music-live-dsp-wave'
import { resolveMusicExpression,type MusicTheme } from '@/lib/music-expression'
import { musicWaveArchetypeLabel,musicWaveSample } from '@/lib/music-wave-geometry'

const layers=['bass','lowMid','mid','vocal','presence','air'] as const
type Props={locale:Locale}

function readTheme():MusicTheme {
  if(typeof document==='undefined') return 'dark'
  return document.documentElement.dataset.theme==='normal'?'normal':'dark'
}

export function MusicOrgan({locale}:Props) {
  const state=useMusicState()
  const [time,setTime]=useState(0)
  const [theme,setTheme]=useState<MusicTheme>('dark')
  const t=messages[locale].music
  const active=state.mode!=='resting'
  const liveDsp=state.signal==='dsp'
  const expression=useMemo(()=>resolveMusicExpression(state,theme),[state,theme])
  const bars=useMemo(
    ()=>layers.map((layer,index)=>({
      layer,
      weight:state.layers[layer].weight,
      phase:index*.9+(expression.seed%29)*.013,
    })),
    [state.layers,expression.seed],
  )

  useEffect(()=>{
    const sync=()=>setTheme(readTheme())
    sync()
    const observer=new MutationObserver(sync)
    observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']})
    return()=>observer.disconnect()
  },[])

  useEffect(()=>{
    if(!active) return
    let frame=0
    const tick=()=>{
      setTime(Date.now())
      frame=requestAnimationFrame(tick)
    }
    frame=requestAnimationFrame(tick)
    return()=>cancelAnimationFrame(frame)
  },[active])

  const status=!state.connected?(locale==='vi'?'CHƯA KẾT NỐI':'NOT CONNECTED')
    : state.mode==='listening'
      ? (locale==='vi'
          ? (liveDsp?'ĐANG NGHE · DSP LIVE':'ĐANG NGHE · NGỮ NGHĨA')
          : (liveDsp?'LISTENING · LIVE DSP':'LISTENING · SEMANTIC'))
      : state.mode==='humming'
        ? (locale==='vi'?'ĐANG NGÂN NGA · TỰ SÁNG TÁC':'HUMMING · SELF-COMPOSING')
        : (locale==='vi'?'ĐANG NGHỈ · LAST.FM SẴN SÀNG':'RESTING · LAST.FM READY')

  const note=state.track?state.track.title+' — '+state.track.artist:t.note
  const displayValue=(value:string|null|undefined)=>{
    if(!value) return '—'
    if(locale!=='vi') return value
    if(value==='unresolved') return 'chưa xác định'
    if(value==='unknown') return 'chưa rõ'
    return value
  }

  const interpretation=liveDsp
    ? [
        {label:locale==='vi'?'nguồn':'source',value:'LIVE DSP'},
        {label:'tempo',value:state.tempoBpm&&state.tempoBpm>0?String(Math.round(state.tempoBpm))+' BPM':'—'},
        {label:locale==='vi'?'nhạc cụ':'instrument',value:displayValue(state.instrumentFamily)},
        {label:locale==='vi'?'kết cấu':'texture',value:displayValue(state.texture)},
        {label:locale==='vi'?'nhịp':'meter',value:displayValue(state.meter)},
      ]
    : [
        {label:'genre',value:displayValue(state.genre)},
        {label:'style',value:displayValue(state.style)},
        {label:locale==='vi'?'tâm trạng':'mood',value:displayValue(state.mood)},
        {label:locale==='vi'?'kết cấu':'texture',value:displayValue(state.texture)},
        {label:locale==='vi'?'nhạc cụ':'instrument',value:displayValue(state.instrumentFamily)},
        {label:'tempo',value:state.tempoBpm&&state.tempoBpm>0?String(Math.round(state.tempoBpm))+' BPM':'—'},
      ]

  const liveColors=liveDspLayerColors[theme]

  return (
    <section className="music-organ" aria-label={t.aria}>
      <div className="music-organ-top">
        <div className="music-organ-head">
          <div><span className="mini-kicker">{t.kicker}</span><h3>{t.title}</h3></div>
          <span className="sensor-state">{status}</span>
        </div>

        <div
          className="music-wave-shell"
          title={note}
          data-expression={liveDsp?'live-dsp':expression.id}
        >
          <svg viewBox="0 0 620 124" role="img" aria-label={t.waveAria}>
            {bars.map((item,row)=>{
              const y=liveDsp ? 13+row*20 : 20+row*17
              const dominant=state.dominantLayer===item.layer
              let path='M 0 '+y
              let activity=item.weight
              let crest=0

              if(liveDsp) {
                const live=liveDspWavePath({
                  layer:item.layer,
                  frames:state.dspFrames??[],
                  now:time,
                  delayMs:state.dspVisualDelayMs??900,
                  width:620,
                  centerY:y,
                  amplitude:6.4,
                  points:62,
                })
                path=live.path
                activity=live.stats.activity
                crest=live.stats.crest
              } else {
                const amp=active
                  ? (2.2+item.weight*7.6)*expression.motion.amplitude*expression.motion.layerSpread
                  : .4
                path='M 0 '+y
                for(let i=0;i<=62;i+=1) {
                  const ratio=i/62
                  const x=i*10
                  const envelope=Math.pow(Math.sin(ratio*Math.PI),1.18)
                  const sample=musicWaveSample({
                    archetype:expression.archetype,
                    r:ratio,
                    clock:time*.00145*expression.motion.speed,
                    phase:item.phase*expression.motion.phaseSpread,
                    frequency:(1.3+row*.42)*expression.motion.phaseSpread,
                    layerIndex:row,
                    seed:expression.seed,
                    motion:expression.motion,
                  })
                  const yy=y+sample*amp*envelope
                  path+=' L '+x+' '+yy.toFixed(2)
                }
              }

              const color=liveDsp?liveColors[item.layer]:expression.colors[item.layer]
              const opacity=liveDsp
                ? Math.min(1,.30+activity*.58+(dominant ? .12 : 0)+crest*.10)
                : dominant?expression.motion.dominantOpacity:expression.motion.secondaryOpacity
              const strokeWidth=liveDsp
                ? (dominant?1.55:1.02)+crest*.72
                : (dominant?1.7:1.05)*expression.motion.stroke
              const glow=!liveDsp&&dominant
                ? 'drop-shadow(0 0 '+String(3+expression.motion.glow*8)+'px '+expression.glowColor+')'
                : 'none'

              return (
                <g key={item.layer}>
                  {liveDsp&&(
                    <path
                      d={path}
                      className="music-layer-live-glow"
                      style={{
                        stroke:color,
                        opacity:theme==='normal' ? .07+crest*.06 : .12+crest*.10,
                        strokeWidth:strokeWidth+(theme==='normal'?3.0:4.2),
                      }}
                    />
                  )}
                  <path
                    d={path}
                    className={'music-layer music-layer-'+item.layer+(dominant?' is-dominant':'')+(crest>.35?' is-crest':'')}
                    style={{
                      stroke:color,
                      opacity,
                      strokeWidth,
                      filter:liveDsp?'none':glow,
                    }}
                  />
                </g>
              )
            })}
          </svg>
        </div>

        <div className="music-legend">
          {layers.map(layer=>(
            <span key={layer}>
              <i style={{background:liveDsp?liveColors[layer]:expression.colors[layer]}} />
              {t.layers[layer]}
            </span>
          ))}
        </div>
        <p className="music-note music-track-line">{note}</p>
      </div>

      <div className="music-organ-insight">
        <div className="music-insight-head">
          <div>
            <span className="mini-kicker">{t.explorer.cardTitle}</span>
            <strong>
              {state.mode==='humming'&&state.composition
                ? state.composition.key+' '+state.composition.mode.toUpperCase()+' · '+state.composition.bpm+' BPM'
                : liveDsp?'LIVE DSP · SIGNAL':state.signal.toUpperCase()}
            </strong>
          </div>
          <span>{Math.round(state.confidence*100)}%</span>
        </div>
        <div className="music-interpret-grid">
          {interpretation.map(item=><div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}
        </div>
        <div className="music-loop-mini" aria-hidden="true">
          <span>{t.explorer.semantic}</span><i>→</i><span>{t.explorer.acoustic}</span><i>→</i><span>{t.explorer.cortex}</span><i>→</i><span>{t.explorer.afterglow}</span>
        </div>
        <div className="music-expression-mini">
          {liveDsp ? (
            <>
              <span>LIVE DSP · TEMPORAL BUFFER</span>
              <span>{state.dspVisualDelayMs??900} MS · SIGNAL-DRIVEN · CREST 85%+</span>
            </>
          ) : (
            <>
              <span>{expression.label} · {musicWaveArchetypeLabel(expression.archetype)}</span>
              <span>{Math.round(expression.valence*100)} V · {Math.round(expression.arousal*100)} E</span>
            </>
          )}
        </div>
        <Link className="music-inspect-link" href="/music-sensor">{t.explorer.open}<span aria-hidden="true">↗</span></Link>
      </div>
    </section>
  )
}
