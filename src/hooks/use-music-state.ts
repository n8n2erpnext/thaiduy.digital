'use client'

import { useSyncExternalStore } from 'react'
import {
  restingMusicState,
  type BufferedMusicDspFrame,
  type MusicCortexState,
  type MusicDspPublicFrame,
  type MusicLayerName,
} from '@/lib/music-state'

const DSP_VISUAL_DELAY_MS=900
const DSP_BUFFER_KEEP_MS=2_800
const DSP_FALLBACK_GRACE_MS=10_000

let baseSnapshot:MusicCortexState=restingMusicState
let snapshot:MusicCortexState=restingMusicState
let pollTimer:ReturnType<typeof setTimeout>|null=null
let staleTimer:ReturnType<typeof setTimeout>|null=null
let stream:EventSource|null=null
let inflight:Promise<void>|null=null
let dspFrames:BufferedMusicDspFrame[]=[]
let lastAudibleAt=0
const listeners=new Set<()=>void>()

const signalLayers=['bass','lowMid','mid','presence','air'] as const

function visualState(state:MusicCortexState):MusicCortexState {
  return {
    ...state,
    dspFrames,
    dspVisualDelayMs:DSP_VISUAL_DELAY_MS,
  }
}

function emit(next:MusicCortexState) {
  snapshot=visualState(next)
  for(const listener of listeners) listener()
}

function pushDspFrame(frame:MusicDspPublicFrame) {
  const receivedAt=Date.now()
  dspFrames=[...dspFrames,{ receivedAt,frame }]
    .filter(item=>receivedAt-item.receivedAt<=DSP_BUFFER_KEEP_MS)
}

function scheduleFallbackPoll(delay=500) {
  if(staleTimer) return
  staleTimer=setTimeout(()=>{
    staleTimer=null
    void poll()
  },delay)
}

function applyDsp(frame:MusicDspPublicFrame) {
  pushDspFrame(frame)
  const audible=frame.rms>=.025||frame.peak>=.05

  if(!audible) {
    // Preserve silent frames so the real signal visibly decays to the baseline.
    emit(snapshot)
    scheduleFallbackPoll(500)
    return
  }

  lastAudibleAt=Date.now()
  if(staleTimer) {
    clearTimeout(staleTimer)
    staleTimer=null
  }

  const dspBase:MusicCortexState=baseSnapshot.signal==='dsp'
    ? baseSnapshot
    : {
        ...baseSnapshot,
        mode:'listening',
        connected:true,
        signal:'dsp',
        track:null,
        genre:null,
        style:null,
        arrangement:null,
        instrumentFamily:null,
        acousticGenreConfidence:0,
        instrumentConfidence:0,
        texture:typeof frame.vocalProbability==='number'&&frame.vocalProbability>=.64
          ? 'vocal-led'
          : typeof frame.vocalProbability==='number'&&frame.vocalProbability<=.15
            ? 'instrumental'
            : 'mixed',
        mood:'unresolved',
        reinterpretation:false,
        confidence:.52,
      }

  const layers={...dspBase.layers}
  for(const name of signalLayers) {
    const weight=Math.max(0,Math.min(1,frame[name]))
    layers[name]={weight,gain:Math.max(0,Math.min(1,.35+weight*.8))}
  }
  if(typeof frame.vocalProbability==='number') {
    const weight=Math.max(0,Math.min(1,frame.vocalProbability))
    layers.vocal={weight,gain:Math.max(0,Math.min(1,.35+weight*.8))}
  }

  const candidates:Array<[MusicLayerName,number]>=signalLayers.map(name=>[name,layers[name].weight])
  if(typeof frame.vocalProbability==='number') candidates.push(['vocal',layers.vocal.weight])
  const dominantLayer=candidates.sort((a,b)=>b[1]-a[1])[0]?.[0]??dspBase.dominantLayer

  if(baseSnapshot.signal!=='dsp') void poll()

  emit({
    ...dspBase,
    signal:'dsp',
    energy:frame.rms,
    tempoBpm:frame.tempoReliable===false
      ? null
      : frame.tempoBpm&&frame.tempoBpm>0
        ? frame.tempoBpm
        : dspBase.tempoBpm,
    beatConfidence:frame.beatConfidence??dspBase.beatConfidence,
    meter:frame.meter??dspBase.meter,
    swingness:frame.swingness??dspBase.swingness,
    percussiveProbability:frame.percussiveProbability??dspBase.percussiveProbability,
    harmonicProbability:frame.harmonicProbability??dspBase.harmonicProbability,
    dynamicRange:frame.dynamicRange??dspBase.dynamicRange,
    dominantLayer,
    layers,
    updatedAt:frame.at,
  })
}

function startStream() {
  if(stream) return
  stream=new EventSource('/api/music/stream')
  stream.addEventListener('signal',(event)=>{
    try {
      applyDsp(JSON.parse((event as MessageEvent<string>).data) as MusicDspPublicFrame)
    } catch {}
  })
  stream.onerror=()=>{
    scheduleFallbackPoll(500)
  }
}

async function poll() {
  if(inflight) return inflight
  inflight=(async()=>{
    try {
      const response=await fetch('/api/music/state',{cache:'no-store'})
      if(response.ok) {
        baseSnapshot=await response.json() as MusicCortexState
        const noRecentAudio=Date.now()-lastAudibleAt>DSP_FALLBACK_GRACE_MS
        if(
          baseSnapshot.signal==='dsp'
          || snapshot.signal!=='dsp'
          || noRecentAudio
        ) {
          emit(baseSnapshot)
        }
      }
    } catch {
      baseSnapshot=restingMusicState
      if(snapshot.signal!=='dsp'||Date.now()-lastAudibleAt>DSP_FALLBACK_GRACE_MS) {
        emit(restingMusicState)
      }
    } finally {
      inflight=null
      if(listeners.size) pollTimer=setTimeout(poll,document.hidden?45_000:12_000)
    }
  })()
  return inflight
}

function subscribe(listener:()=>void) {
  listeners.add(listener)
  if(listeners.size===1) {
    startStream()
    void poll()
  }
  return()=>{
    listeners.delete(listener)
    if(listeners.size) return
    if(pollTimer) clearTimeout(pollTimer)
    if(staleTimer) clearTimeout(staleTimer)
    pollTimer=null
    staleTimer=null
    stream?.close()
    stream=null
  }
}

export function useMusicState() {
  return useSyncExternalStore(subscribe,()=>snapshot,()=>restingMusicState)
}
