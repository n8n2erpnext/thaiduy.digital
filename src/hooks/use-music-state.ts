'use client'

import { useSyncExternalStore } from 'react'
import {
  restingMusicState,
  type BufferedMusicDspFrame,
  type MusicCortexState,
  type MusicDspPublicFrame,
  type MusicLayerName,
  type MusicPlaybackPublicSignal,
} from '@/lib/music-state'

const DSP_VISUAL_DELAY_MS=900
const DSP_BUFFER_KEEP_MS=5_000
const DSP_FALLBACK_GRACE_MS=10_000

let baseSnapshot:MusicCortexState=restingMusicState
let snapshot:MusicCortexState=restingMusicState
let pollTimer:ReturnType<typeof setTimeout>|null=null
let staleTimer:ReturnType<typeof setTimeout>|null=null
let stream:EventSource|null=null
let inflight:Promise<void>|null=null
let dspFrames:BufferedMusicDspFrame[]=[]
let dspVisualAt=0
let dspVisualSeq=0
let lastAudibleAt=0
let livePlaybackKnown=false
let livePlaybackTrack:MusicCortexState['track']=null
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
  const now=Date.now()
  const step=Math.max(40,Math.min(160,frame.windowMs||85))
  const seqGap=dspVisualSeq>0?Math.max(1,frame.seq-dspVisualSeq):1
  const predicted=dspVisualAt>0?dspVisualAt+step*seqGap:now
  const drift=now-predicted

  // AAC transport arrives in bursts (typically ~3 decoded 85 ms frames every
  // ~250 ms). Preserve the PCM/media cadence instead of stamping all frames
  // with the burst arrival time. Re-anchor only after a true transport gap.
  const receivedAt=
    dspVisualAt<=0||dspVisualSeq<=0||frame.seq<=dspVisualSeq||drift>750||drift<-500
      ? now
      : predicted

  dspVisualAt=receivedAt
  dspVisualSeq=frame.seq
  dspFrames=[...dspFrames,{ receivedAt,frame }]
    .filter(item=>now-item.receivedAt<=DSP_BUFFER_KEEP_MS)
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

  const currentTrack=livePlaybackKnown ? livePlaybackTrack : baseSnapshot.track
  const dspBase:MusicCortexState=baseSnapshot.signal==='dsp'
    ? { ...baseSnapshot, track:currentTrack }
    : {
        ...baseSnapshot,
        mode:'listening',
        connected:true,
        signal:'dsp',
        track:currentTrack,
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
  // Live DSP visual lanes stay physical. The legacy vocal lane represents
  // the mid/presence region and is not driven by vocalProbability.
  const vocalBand=Math.max(0,Math.min(1,frame.mid*.60+frame.presence*.40))
  layers.vocal={weight:vocalBand,gain:Math.max(0,Math.min(1,.35+vocalBand*.8))}

  const candidates:Array<[MusicLayerName,number]>=signalLayers.map(name=>[name,layers[name].weight])
  candidates.push(['vocal',layers.vocal.weight])
  const dominantLayer=candidates.sort((a,b)=>b[1]-a[1])[0]?.[0]??dspBase.dominantLayer

  if(baseSnapshot.signal!=='dsp') void poll()

  emit({
    ...dspBase,
    signal:'dsp',
    energy:frame.rms,
    tempoBpm:frame.pulseReliable&&frame.pulseBpm&&frame.pulseBpm>0
      ? frame.pulseBpm
      : frame.tempoReliable===false
        ? null
        : frame.tempoBpm&&frame.tempoBpm>0
          ? frame.tempoBpm
          : null,
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

function applyPlayback(playback:MusicPlaybackPublicSignal) {
  const active=playback.state==='playing'||playback.state==='buffering'
  livePlaybackKnown=true
  livePlaybackTrack=active
    ? {
        artist:playback.artist.trim()||'Unknown Artist',
        title:playback.title.trim(),
        url:'',
        album:playback.album,
        packageName:playback.packageName,
      }
    : null

  if(snapshot.signal==='dsp') {
    emit({ ...snapshot, track:livePlaybackTrack })
    return
  }
  void poll()
}

function startStream() {
  if(stream) return
  stream=new EventSource('/api/music/stream')
  stream.addEventListener('signal',(event)=>{
    try {
      applyDsp(JSON.parse((event as MessageEvent<string>).data) as MusicDspPublicFrame)
    } catch {}
  })
  stream.addEventListener('playback',(event)=>{
    try {
      applyPlayback(JSON.parse((event as MessageEvent<string>).data) as MusicPlaybackPublicSignal)
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
        if(baseSnapshot.signal==='dsp') {
          livePlaybackKnown=true
          livePlaybackTrack=baseSnapshot.track
        }
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
