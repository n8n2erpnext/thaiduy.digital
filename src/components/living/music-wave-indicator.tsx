'use client'

import { useEffect,useMemo,useRef,useState,type CSSProperties } from 'react'
import { HummingPlayer } from '@/components/living/humming-player'
import { useMusicState } from '@/hooks/use-music-state'
import type { Locale } from '@/i18n/config'
import { messages } from '@/i18n/messages'
import {
  blendMusicMotion,
  resolveMusicExpression,
  type MusicExpression,
  type MusicTheme,
} from '@/lib/music-expression'
import { liveDspLayerColors,liveDspWavePath } from '@/lib/music-live-dsp-wave'
import type { HummingComposition,MusicLayerName } from '@/lib/music-state'
import { musicWaveArchetypeLabel,musicWaveSample } from '@/lib/music-wave-geometry'

const layerOrder:MusicLayerName[]=['bass','lowMid','mid','vocal','presence','air']
const phase:Record<MusicLayerName,number>={bass:.2,lowMid:1.1,mid:2.2,vocal:.7,presence:2.9,air:4.1}
const freq:Record<MusicLayerName,number>={bass:1.2,lowMid:1.8,mid:2.6,vocal:1.6,presence:3.4,air:4.4}
const layerIndex:Record<MusicLayerName,number>={bass:0,lowMid:1,mid:2,vocal:3,presence:4,air:5}

function phraseAt(composition:HummingComposition|null,time:number) {
  if (!composition || !composition.notes.length || !time) return null
  const beatsPerBar=composition.meter==='3/4'?3:4
  const totalBeats=composition.bars*beatsPerBar
  const beatMs=60_000/composition.bpm
  const cursor=((time-composition.startedAt)/beatMs%totalBeats+totalBeats)%totalBeats
  return composition.notes.find(note=>cursor>=note.beat && cursor<note.beat+note.duration)
    ?? composition.notes.slice().reverse().find(note=>note.beat<=cursor)
    ?? composition.notes[0]
}

function pathFor(
  layer:MusicLayerName,
  weight:number,
  time:number,
  active:boolean,
  composition:HummingComposition|null,
  motion:MusicExpression['motion'],
  archetype:MusicExpression['archetype'],
  seed:number,
) {
  if (!active) return 'M 4 12 L 108 12'
  const note=phraseAt(composition,time)
  const points=42
  const pitchMotion=note?(note.midi-64)*.045:0
  const phraseLift=note?note.velocity*(note.phrase==='answer'?1.12:1):1
  const layerCharacter=1+(layerIndex[layer]-.5)*.025
  const amp=(1.15+weight*(layer==='vocal'?7.2:5.4))
    *phraseLift
    *motion.amplitude
    *motion.layerSpread
    *layerCharacter
  const seeded=((seed>>>((layerIndex[layer]*3)%24))&7)/28
  const frequency=(freq[layer]+pitchMotion+seeded)*motion.phaseSpread
  const clock=(time%100000)*.0038*motion.speed
  let path='M 4 12'
  for(let i=0;i<=points;i+=1) {
    const r=i/points
    const x=4+r*104
    const env=Math.pow(Math.sin(r*Math.PI),1.65)
    const contour=note?Math.sin(r*Math.PI*2+note.beat*.31)*note.velocity*.7:0
    const sample=musicWaveSample({
      archetype,
      r,
      clock,
      phase:phase[layer]*motion.phaseSpread+contour*.18,
      frequency,
      layerIndex:layerIndex[layer],
      seed,
      motion,
    })
    const phraseAccent=note?Math.sin(r*Math.PI*2+note.beat*.31)*note.velocity*.12*amp*env:0
    const y=12+sample*amp*env+phraseAccent
    path+=' L '+x.toFixed(2)+' '+y.toFixed(2)
  }
  return path
}

function readTheme():MusicTheme {
  if (typeof document==='undefined') return 'dark'
  return document.documentElement.dataset.theme==='normal'?'normal':'dark'
}

function instrumentLabel(composition:HummingComposition|null,expression:MusicExpression) {
  return (composition?.instrument??expression.instrumentHint).replaceAll('-',' ')
}

type Props={locale:Locale}
export function MusicWaveIndicator({locale}:Props) {
  const [time,setTime]=useState(0)
  const [theme,setTheme]=useState<MusicTheme>('dark')
  const state=useMusicState()
  const t=messages[locale].music.indicator
  const active=state.mode==='listening'||state.mode==='humming'
  const liveDsp=state.signal==='dsp'
  const expression=useMemo(()=>resolveMusicExpression(state,theme),[state,theme])
  const liveColors=liveDspLayerColors[theme]
  const [displayMotion,setDisplayMotion]=useState(expression.motion)
  const [tooltipOpen,setTooltipOpen]=useState(false)
  const [tooltipCycle,setTooltipCycle]=useState(0)
  const [titleDistance,setTitleDistance]=useState(0)
  const targetMotionRef=useRef(expression.motion)
  const titleViewportRef=useRef<HTMLDivElement>(null)

  useEffect(()=>{
    const sync=()=>setTheme(readTheme())
    sync()
    const observer=new MutationObserver(sync)
    observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']})
    return ()=>observer.disconnect()
  },[])

  useEffect(()=>{
    targetMotionRef.current=expression.motion
  },[expression.motion])

  useEffect(()=>{
    if (!active) return
    let frame=0
    const tick=()=>{
      setDisplayMotion(current=>blendMusicMotion(current,targetMotionRef.current,.045))
      setTime(Date.now())
      frame=requestAnimationFrame(tick)
    }
    frame=requestAnimationFrame(tick)
    return ()=>cancelAnimationFrame(frame)
  },[active])

  useEffect(()=>{
    if(!tooltipOpen) return
    let frame=0
    const measure=()=>{
      const element=titleViewportRef.current
      if(!element) return
      setTitleDistance(Math.max(0,element.scrollWidth-element.clientWidth))
    }
    frame=requestAnimationFrame(measure)
    const observer=new ResizeObserver(measure)
    if(titleViewportRef.current) observer.observe(titleViewportRef.current)
    return()=>{
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  },[tooltipOpen,state.track?.title,state.track?.artist,state.composition?.title,state.mode,locale])

  const vi=locale==='vi'
  const styleLabel=state.style??state.genre??(vi?'chưa xác định':'unresolved')
  const modeLabel=t[state.mode]
  const composition=state.mode==='humming'?state.composition:null
  const title=state.track
    ? state.track.title+' — '+state.track.artist
    : composition?composition.title:state.mode==='humming'?t.hummingTitle:t.title

  const detail=useMemo(()=>{
    if (!state.connected) return t.resting+' · '+t.notConnected
    if (state.mode==='resting') return modeLabel+' · '+(vi?'LAST.FM SẴN SÀNG':'LAST.FM READY')
    if (composition) {
      return (vi?'ĐANG NGÂN NGA':'HUMMING')
        +' · '+composition.key+' '+composition.mode.toUpperCase()
        +' · '+composition.bpm+' BPM'
        +' · '+(vi&&state.mood==='unresolved'?'CHƯA XÁC ĐỊNH':state.mood.toUpperCase())
    }
    if(liveDsp) {
      const tempo=state.tempoBpm&&state.tempoBpm>0?Math.round(state.tempoBpm)+' BPM':'TEMPO —'
      const instrument=state.instrumentFamily?state.instrumentFamily.toUpperCase():'INSTRUMENT —'
      return modeLabel+' · LIVE DSP · '+tempo+' · '+instrument
    }
    const bits=[styleLabel,state.arrangement,state.texture].filter(Boolean)
    return modeLabel+' · '+bits.join(' · ')
      +' · '+(vi?'NGỮ NGHĨA · LAST.FM':'SEMANTIC · LAST.FM')
  },[composition,liveDsp,modeLabel,state,styleLabel,t,vi])

  const visualDetail=liveDsp
    ? (vi?'TÍN HIỆU':'SIGNAL')+' · LIVE DSP · '+(state.dspVisualDelayMs??900)+' MS BUFFER'
    : (vi?'MÀU SẮC':'PALETTE')+' · '+expression.label.toUpperCase()
  const motionDetail=liveDsp
    ? (vi?'CHUYỂN ĐỘNG':'MOTION')+' · SIGNAL-DRIVEN · CREST 85%+'
    : (vi?'CHUYỂN ĐỘNG':'MOTION')+' · '+musicWaveArchetypeLabel(expression.archetype).toUpperCase()
      +' · '+(vi?'NĂNG LƯỢNG':'ENERGY')+' '+Math.round(expression.arousal*100)
      +' · '+(vi?'CẢM XÚC':'VALENCE')+' '+Math.round(expression.valence*100)

  const subdetail=composition
    ? composition.meter+' · '+composition.bars+' '+(vi?'Ô NHỊP':'BARS')
      +' · '+instrumentLabel(composition,expression).toUpperCase()
      +' · '+String(composition.ensemble?.layers??2)+' '+(vi?'LỚP':'LAYERS')
      +' · '+(vi?'TỰ SINH · KHÔNG LƯU GIAI ĐIỆU ĐÃ NGHE':'GENERATED · NO STORED MELODY')
    : null

  const shouldPanTitle=Boolean(state.track)&&titleDistance>4
  const titlePanDuration=Math.min(14,Math.max(6,6+titleDistance/42))

  const openTooltip=()=>{
    if(tooltipOpen) return
    setTitleDistance(0)
    setTooltipCycle(cycle=>cycle+1)
    setTooltipOpen(true)
  }

  return (
    <div className="header-wave-cluster">
      <div
        className="header-wave-wrap"
        onMouseEnter={openTooltip}
        onMouseLeave={()=>setTooltipOpen(false)}
        onFocusCapture={openTooltip}
        onBlurCapture={event=>{
          if(!event.currentTarget.contains(event.relatedTarget as Node|null)) setTooltipOpen(false)
        }}
      >
        <div
          className="header-wave"
          role="img"
          tabIndex={0}
          data-expression={liveDsp?'live-dsp':expression.id}
          aria-label={title+' · '+detail+' · '+visualDetail+' · '+motionDetail+(subdetail?' · '+subdetail:'')}
        >
          <svg viewBox="0 0 112 24" aria-hidden="true">
            <path
              d="M 4 12 L 108 12"
              className="header-wave-base"
              style={{stroke:liveDsp?(theme==='dark'?'#65727A':'#A6AFAB'):expression.baseColor}}
            />
            {layerOrder.map(layer=>{
              const dominant=state.dominantLayer===layer
              const live=liveDsp
                ? liveDspWavePath({
                    layer,
                    frames:state.dspFrames??[],
                    now:time,
                    delayMs:state.dspVisualDelayMs??900,
                    xStart:4,
                    width:104,
                    centerY:12,
                    amplitude:6.2,
                    points:42,
                  })
                : null
              const opacity=live
                ? Math.min(1,.28+live.stats.activity*.58+(dominant ? .10 : 0)+live.stats.crest*.12)
                : dominant
                  ? displayMotion.dominantOpacity
                  : displayMotion.secondaryOpacity*(.9+state.layers[layer].weight*.1)
              const width=live
                ? (dominant?1.36:1.0)+live.stats.crest*.62
                : (dominant?1.42:1.02)*displayMotion.stroke
              const color=live?liveColors[layer]:expression.colors[layer]
              const glow=live
                ? (dominant||live.stats.crest>.35)
                  ? 'drop-shadow(0 0 '+String(1.6+live.stats.crest*6.2)+'px '+color+')'
                  : 'none'
                : dominant
                  ? 'drop-shadow(0 0 '+String(2+displayMotion.glow*7)+'px '+expression.glowColor+')'
                  : 'none'
              return (
                <path
                  key={layer}
                  d={live?.path??pathFor(
                    layer,
                    state.layers[layer].weight,
                    time,
                    active,
                    composition,
                    displayMotion,
                    expression.archetype,
                    expression.seed,
                  )}
                  className={'header-wave-layer header-wave-layer-'+layer+(dominant?' is-dominant':'')+(live&&live.stats.crest>.35?' is-crest':'')}
                  style={{
                    stroke:color,
                    opacity,
                    strokeWidth:width,
                    filter:glow,
                  }}
                />
              )
            })}
          </svg>
        </div>
        <div
          className="header-wave-tooltip"
          role="tooltip"
          data-open={tooltipOpen?'true':'false'}
          data-title-mode={state.track?'track':'content'}
        >
          <div
            ref={titleViewportRef}
            className="header-wave-title-viewport"
            data-pan={shouldPanTitle?'true':'false'}
          >
            <strong
              key={title+'-'+tooltipCycle}
              className="header-wave-title"
              style={{
                '--header-wave-title-distance':titleDistance+'px',
                '--header-wave-title-duration':titlePanDuration+'s',
                animation:tooltipOpen&&shouldPanTitle
                  ? 'header-wave-title-pan var(--header-wave-title-duration) ease-in-out infinite'
                  : undefined,
              } as CSSProperties}
            >{title}</strong>
          </div>
          <span>{detail}</span>
          <span>{visualDetail}</span>
          <span>{motionDetail}</span>
          {subdetail&&<span>{subdetail}</span>}
        </div>
      </div>
      {composition&&<HummingPlayer composition={composition} locale={locale}/>}
    </div>
  )
}
