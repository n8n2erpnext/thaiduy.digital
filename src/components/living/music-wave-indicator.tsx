'use client'

import { useEffect, useMemo, useState } from 'react'
import { HummingPlayer } from '@/components/living/humming-player'
import { useMusicState } from '@/hooks/use-music-state'
import type { Locale } from '@/i18n/config'
import { messages } from '@/i18n/messages'
import type { HummingComposition, MusicLayerName } from '@/lib/music-state'

const layerOrder: MusicLayerName[] = ['bass','lowMid','mid','vocal','presence','air']
const phase: Record<MusicLayerName, number> = { bass:0.2, lowMid:1.1, mid:2.2, vocal:0.7, presence:2.9, air:4.1 }
const freq: Record<MusicLayerName, number> = { bass:1.2, lowMid:1.8, mid:2.6, vocal:1.6, presence:3.4, air:4.4 }

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
function pathFor(layer:MusicLayerName,weight:number,time:number,active:boolean,composition:HummingComposition|null) {
  if (!active) return 'M 4 12 L 108 12'
  const note=phraseAt(composition,time)
  const points=42
  const pitchMotion=note ? (note.midi-64)*.045 : 0
  const phraseLift=note ? note.velocity*(note.phrase==='answer'?1.12:1) : 1
  const amp=(1.2+weight*(layer==='vocal'?7:5.2))*phraseLift
  const motion=freq[layer]+pitchMotion
  const clock=(time%100000)*.0038
  let path='M 4 12'
  for(let i=0;i<=points;i+=1) {
    const r=i/points, x=4+r*104, env=Math.pow(Math.sin(r*Math.PI),1.65)
    const contour=note ? Math.sin(r*Math.PI*2 + note.beat*.31)*note.velocity*.7 : 0
    const y=12 + Math.sin(r*Math.PI*motion + clock + phase[layer] + contour)*amp*env
    path += ' L '+x.toFixed(2)+' '+y.toFixed(2)
  }
  return path
}

type Props={ locale:Locale }

export function MusicWaveIndicator({ locale }:Props) {
  const [time,setTime]=useState(0)
  const state=useMusicState()
  const t=messages[locale].music.indicator
  const active=state.mode==='listening' || state.mode==='humming'
  useEffect(()=>{
    if (!active) return
    let frame=0
    const tick=()=>{ setTime(Date.now()); frame=requestAnimationFrame(tick) }
    frame=requestAnimationFrame(tick)
    return ()=>cancelAnimationFrame(frame)
  },[active])

  const styleLabel=state.style ?? state.genre ?? 'unresolved'
  const modeLabel=t[state.mode]
  const composition=state.mode==='humming' ? state.composition : null
  const title=state.track
    ? state.track.title+' — '+state.track.artist
    : composition ? composition.title : state.mode==='humming' ? t.hummingTitle : t.title

  const detail=useMemo(()=>{
    if (!state.connected) return t.resting+' · '+t.notConnected
    if (state.mode==='resting') return modeLabel+' · LAST.FM READY'
    if (composition) {
      return 'HUMMING · '+composition.key+' '+composition.mode.toUpperCase()+' · '+composition.bpm+' BPM · '+state.mood.toUpperCase()
    }
    const bits=[styleLabel,state.arrangement,state.texture].filter(Boolean)
    return modeLabel+' · '+bits.join(' · ')+' · '+(state.signal==='dsp'?'LIVE DSP':'SEMANTIC · LAST.FM')
  },[composition,modeLabel,state,styleLabel,t])

  const subdetail=composition
    ? composition.meter+' · '+composition.bars+' BARS · '+composition.voice.toUpperCase()+' · GENERATED · NO STORED MELODY'
    : null
  return (
    <div className="header-wave-cluster">
      <div className="header-wave-wrap">
        <div
          className="header-wave"
          role="img"
          tabIndex={0}
          aria-label={title+' · '+detail+(subdetail?' · '+subdetail:'')}
        >
          <svg viewBox="0 0 112 24" aria-hidden="true">
            <path d="M 4 12 L 108 12" className="header-wave-base"/>
            {layerOrder.map(layer=>(
              <path key={layer} d={pathFor(layer,state.layers[layer].weight,time,active,composition)}
                className={'header-wave-layer header-wave-layer-'+layer+(state.dominantLayer===layer?' is-dominant':'')}/>
            ))}
          </svg>
        </div>
        <div className="header-wave-tooltip" role="tooltip">
          <strong>{title}</strong>
          <span>{detail}</span>
          {subdetail && <span>{subdetail}</span>}
        </div>
      </div>
      {composition && <HummingPlayer composition={composition} locale={locale}/>}
    </div>
  )
}
