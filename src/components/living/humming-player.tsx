'use client'

import { useEffect,useMemo,useRef,useState } from 'react'
import {
  hummingPlaybackProfile,
  scheduleHummingComposition,
} from '@/lib/humming-audio'
import type { HummingComposition } from '@/lib/music-state'
import type { Locale } from '@/i18n/config'

type Props={composition:HummingComposition;locale:Locale;showPanel?:boolean}

export function HummingScore({composition}:{composition:HummingComposition}) {
  const width=430,height=122,left=20,right=14,top=30,lineGap=10
  const beatsPerBar=composition.meter==='3/4'?3:4
  const totalBeats=composition.bars*beatsPerBar
  const usable=width-left-right
  const xFor=(beat:number)=>left+(beat/totalBeats)*usable
  const yFor=(midi:number)=>top+lineGap*2-(midi-64)*2.15
  return (
    <svg className="humming-score-svg" viewBox={'0 0 '+width+' '+height} role="img" aria-label="Generated Sentinel music score">
      {Array.from({length:5},(_,i)=>(
        <line key={i} x1={left} x2={width-right} y1={top+i*lineGap} y2={top+i*lineGap} className="humming-staff-line"/>
      ))}
      {Array.from({length:composition.bars+1},(_,i)=>{
        const x=xFor(i*beatsPerBar)
        return <line key={'bar'+i} x1={x} x2={x} y1={top} y2={top+4*lineGap} className="humming-bar-line"/>
      })}
      {composition.notes.map((note,index)=>{
        const x=xFor(note.beat+.18),y=Math.max(13,Math.min(84,yFor(note.midi)))
        return (
          <g key={index} className={'humming-note humming-note-'+note.phrase}>
            <ellipse cx={x} cy={y} rx="4.2" ry="3.1" transform={'rotate(-18 '+x+' '+y+')'}/>
            <line x1={x+3.5} x2={x+3.5} y1={y} y2={y-19}/>
            <text x={x} y={105} textAnchor="middle">{note.name}</text>
          </g>
        )
      })}
      <text x={left} y={16} className="humming-score-clef">𝄞</text>
    </svg>
  )
}

export function HummingPlayer({composition,locale,showPanel=true}:Props) {
  const [open,setOpen]=useState(false)
  const [playing,setPlaying]=useState(false)
  const contextRef=useRef<AudioContext|null>(null)
  const timerRef=useRef<ReturnType<typeof setTimeout>|null>(null)
  const playerRef=useRef<HTMLDivElement|null>(null)
  const profile=useMemo(()=>hummingPlaybackProfile(composition),[composition])

  useEffect(()=>()=>{
    if(timerRef.current) clearTimeout(timerRef.current)
    void contextRef.current?.close()
  },[])

  useEffect(()=>{
    if(!open||!showPanel) return
    const handlePointerDown=(event:PointerEvent)=>{
      const target=event.target
      if(!(target instanceof Node)) return
      if(!playerRef.current?.contains(target)) setOpen(false)
    }
    document.addEventListener('pointerdown',handlePointerDown)
    return ()=>document.removeEventListener('pointerdown',handlePointerDown)
  },[open,showPanel])

  async function stopPlayback() {
    if(timerRef.current) clearTimeout(timerRef.current)
    timerRef.current=null
    const context=contextRef.current
    contextRef.current=null
    setPlaying(false)
    if(context) await context.close().catch(()=>undefined)
  }

  async function togglePlayback() {
    if(playing){
      await stopPlayback()
      return
    }
    if(showPanel) setOpen(true)
    const AudioContextCtor=window.AudioContext
    const context=new AudioContextCtor()
    contextRef.current=context
    await context.resume()
    const playback=scheduleHummingComposition(context,composition,context.currentTime+.06)
    setPlaying(true)
    timerRef.current=setTimeout(()=>{
      void stopPlayback()
    },(playback.durationSeconds+.35)*1000)
  }

  const vi=locale==='vi'
  const layerLabel=String(profile.layers)+' '+(vi?'LỚP':'LAYERS')
  const textureLabel=profile.pad.replaceAll('-',' ')
    +(profile.bass!=='none'?' + '+profile.bass.replaceAll('-',' '):'')

  return (
    <div ref={playerRef} className="humming-player">
      <button
        className={'humming-speaker'+(playing?' is-playing':'')}
        type="button"
        aria-label={vi
          ? (playing?'Dừng Sentinel ngân nga':'Nghe Sentinel ngân nga')
          : (playing?'Stop Sentinel humming':'Hear Sentinel humming')}
        title={profile.instrumentLabel+' · '+layerLabel}
        onClick={()=>void togglePlayback()}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 10v4h4l5 4V6L8 10H4Z"/>
          <path d="M16 9c1.3 1.4 1.3 4.6 0 6M18.5 6.5c3 3 3 8 0 11"/>
        </svg>
      </button>

      {open&&(
        <div className="humming-score-panel">
          <div className="humming-score-head">
            <div>
              <strong>{composition.title}</strong>
              <span>
                {composition.key} {composition.mode.toUpperCase()}
                {' · '}{composition.bpm} BPM
                {' · '}{composition.meter}
              </span>
            </div>
            <button type="button" onClick={()=>setOpen(false)} aria-label={vi?'Đóng bản nhạc':'Close score'}>×</button>
          </div>

          <HummingScore composition={composition}/>

          <div className="humming-score-meta">
            <span>
              {profile.instrumentLabel}
              {' · '}{layerLabel}
              {' · '}{textureLabel}
            </span>
            <span>{composition.chordProgression.join(' — ')}</span>
            <span>{vi?'tự sinh · không lưu giai điệu đã nghe':'generated · no stored melody'}</span>
          </div>
        </div>
      )}
    </div>
  )
}
