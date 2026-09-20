'use client'

import { useEffect, useRef, useState } from 'react'
import type { HummingComposition } from '@/lib/music-state'
import type { Locale } from '@/i18n/config'

type Props = { composition: HummingComposition; locale: Locale; showPanel?: boolean }

function midiFrequency(midi:number) {
  return 440 * Math.pow(2,(midi-69)/12)
}

function scoreDuration(composition:HummingComposition) {
  const beats=composition.meter==='3/4' ? composition.bars*3 : composition.bars*4
  return beats * 60 / composition.bpm
}

function swingOffset(beat:number,swing:number,secondsPerBeat:number) {
  const eighth=Math.round(beat*2)
  return eighth%2===1 ? swing*.22*secondsPerBeat : 0
}
function scheduleTone(context:AudioContext, destination:AudioNode, composition:HummingComposition, note:HummingComposition['notes'][number], base:number) {
  const secondsPerBeat=60/composition.bpm
  const start=base + note.beat*secondsPerBeat + swingOffset(note.beat,composition.swing,secondsPerBeat)
  const length=Math.max(.08,note.duration*secondsPerBeat*.9)
  const gain=context.createGain()
  gain.gain.setValueAtTime(.0001,start)
  gain.gain.exponentialRampToValueAtTime(Math.max(.018,note.velocity*.095),start+.035)
  gain.gain.exponentialRampToValueAtTime(.0001,start+length)
  gain.connect(destination)

  const oscillator=context.createOscillator()
  oscillator.frequency.setValueAtTime(midiFrequency(note.midi),start)
  oscillator.type=composition.voice==='soft-synth' ? 'triangle' : 'sine'
  oscillator.connect(gain)
  oscillator.start(start)
  oscillator.stop(start+length+.04)

  if (composition.voice==='hum') {
    const overtone=context.createOscillator()
    const overtoneGain=context.createGain()
    overtone.frequency.setValueAtTime(midiFrequency(note.midi)*2,start)
    overtone.type='sine'
    overtoneGain.gain.setValueAtTime(.012,start)
    overtoneGain.gain.exponentialRampToValueAtTime(.0001,start+length)
    overtone.connect(overtoneGain).connect(destination)
    overtone.start(start)
    overtone.stop(start+length+.03)
  }
  if (composition.voice==='whistle') {
    oscillator.frequency.setValueAtTime(midiFrequency(note.midi+12),start)
  }

  if (composition.voice==='breath') {
    const frames=Math.max(1,Math.floor(context.sampleRate*length))
    const buffer=context.createBuffer(1,frames,context.sampleRate)
    const data=buffer.getChannelData(0)
    for(let i=0;i<frames;i+=1) data[i]=(Math.random()*2-1)*.18
    const noise=context.createBufferSource()
    const filter=context.createBiquadFilter()
    const noiseGain=context.createGain()
    filter.type='bandpass'
    filter.frequency.value=midiFrequency(note.midi)*2.1
    filter.Q.value=2.4
    noiseGain.gain.setValueAtTime(.025,start)
    noiseGain.gain.exponentialRampToValueAtTime(.0001,start+length)
    noise.buffer=buffer
    noise.connect(filter).connect(noiseGain).connect(destination)
    noise.start(start)
    noise.stop(start+length)
  }
}

export function HummingScore({ composition }:{ composition:HummingComposition }) {
  const width=430, height=122, left=20, right=14, top=30, lineGap=10
  const beatsPerBar=composition.meter==='3/4'?3:4
  const totalBeats=composition.bars*beatsPerBar
  const usable=width-left-right
  const xFor=(beat:number)=>left+(beat/totalBeats)*usable
  const yFor=(midi:number)=>top+lineGap*2-(midi-64)*2.15
  return (
    <svg className="humming-score-svg" viewBox={'0 0 '+width+' '+height} role="img" aria-label="Generated Sentinel music score">
      {Array.from({length:5},(_,i)=><line key={i} x1={left} x2={width-right} y1={top+i*lineGap} y2={top+i*lineGap} className="humming-staff-line"/>)}
      {Array.from({length:composition.bars+1},(_,i)=>{
        const x=xFor(i*beatsPerBar)
        return <line key={'bar'+i} x1={x} x2={x} y1={top} y2={top+4*lineGap} className="humming-bar-line"/>
      })}
      {composition.notes.map((note,index)=>{
        const x=xFor(note.beat+.18), y=Math.max(13,Math.min(84,yFor(note.midi)))
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
export function HummingPlayer({ composition, locale, showPanel=true }:Props) {
  const [open,setOpen]=useState(false)
  const [playing,setPlaying]=useState(false)
  const contextRef=useRef<AudioContext|null>(null)
  const timerRef=useRef<ReturnType<typeof setTimeout>|null>(null)
  const playerRef=useRef<HTMLDivElement|null>(null)

  useEffect(()=>()=> {
    if (timerRef.current) clearTimeout(timerRef.current)
    void contextRef.current?.close()
  },[])

  useEffect(()=>{
    if (!open || !showPanel) return
    const handlePointerDown=(event:PointerEvent)=>{
      const target=event.target
      if (!(target instanceof Node)) return
      if (!playerRef.current?.contains(target)) setOpen(false)
    }
    document.addEventListener('pointerdown',handlePointerDown)
    return ()=>document.removeEventListener('pointerdown',handlePointerDown)
  },[open,showPanel])

  async function togglePlayback() {
    if (playing) {
      if (timerRef.current) clearTimeout(timerRef.current)
      await contextRef.current?.close()
      contextRef.current=null
      setPlaying(false)
      return
    }
    if (showPanel) setOpen(true)
    const AudioContextCtor=window.AudioContext
    const context=new AudioContextCtor()
    contextRef.current=context
    await context.resume()
    const master=context.createGain()
    master.gain.value=.72
    master.connect(context.destination)
    const base=context.currentTime+.06
    for (const note of composition.notes) scheduleTone(context,master,composition,note,base)
    setPlaying(true)
    timerRef.current=setTimeout(()=>setPlaying(false),(scoreDuration(composition)+.2)*1000)
  }

  const vi=locale==='vi'
  return (
    <div ref={playerRef} className="humming-player">
      <button className={'humming-speaker'+(playing?' is-playing':'')} type="button"
        aria-label={vi ? (playing?'Dừng Sentinel ngân nga':'Nghe Sentinel ngân nga') : (playing?'Stop Sentinel humming':'Hear Sentinel humming')}
        onClick={()=>void togglePlayback()}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 10v4h4l5 4V6L8 10H4Z"/>
          <path d="M16 9c1.3 1.4 1.3 4.6 0 6M18.5 6.5c3 3 3 8 0 11"/>
        </svg>
      </button>
      {open && (
        <div className="humming-score-panel">
          <div className="humming-score-head">
            <div><strong>{composition.title}</strong><span>{composition.key} {composition.mode.toUpperCase()} · {composition.bpm} BPM · {composition.meter}</span></div>
            <button type="button" onClick={()=>setOpen(false)} aria-label={vi?'Đóng bản nhạc':'Close score'}>×</button>
          </div>
          <HummingScore composition={composition}/>
          <div className="humming-score-meta">
            <span>{composition.voice} · {composition.chordProgression.join(' — ')}</span>
            <span>{vi?'tự sinh · không lưu giai điệu đã nghe':'generated · no stored melody'}</span>
          </div>
        </div>
      )}
    </div>
  )
}
