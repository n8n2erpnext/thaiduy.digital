import type { BufferedMusicDspFrame,MusicDspPublicFrame,MusicLayerName } from '@/lib/music-state'

const clamp=(value:number,min=0,max=1)=>Math.max(min,Math.min(max,value))
const clamp01=(value:number)=>clamp(value)
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t

function dbToLinear(db:number|undefined,fallback:number) {
  if(typeof db!=='number'||!Number.isFinite(db)) return fallback
  if(db<=-120) return 0
  return clamp(Math.pow(10,db/20),0,1.5)
}

function numeric(left:MusicDspPublicFrame,right:MusicDspPublicFrame,key:keyof MusicDspPublicFrame,t:number,fallback=0) {
  const a=left[key],b=right[key]
  return lerp(
    typeof a==='number'&&Number.isFinite(a)?a:fallback,
    typeof b==='number'&&Number.isFinite(b)?b:fallback,
    t,
  )
}

export function sampleMusicDspFrameAt(frames:BufferedMusicDspFrame[],at:number):MusicDspPublicFrame|null {
  if(!frames.length) return null
  if(at<=frames[0].receivedAt) return frames[0].frame
  const last=frames[frames.length-1]
  if(at>=last.receivedAt) return last.frame
  let lo=0,hi=frames.length-1
  while(lo+1<hi){const mid=(lo+hi)>>1;if(frames[mid].receivedAt<=at)lo=mid;else hi=mid}
  const left=frames[lo],right=frames[hi]
  const t=clamp01((at-left.receivedAt)/Math.max(1,right.receivedAt-left.receivedAt))
  return {
    ...left.frame,seq:t<.5?left.frame.seq:right.frame.seq,at:t<.5?left.frame.at:right.frame.at,
    rms:numeric(left.frame,right.frame,'rms',t),peak:numeric(left.frame,right.frame,'peak',t),
    bass:numeric(left.frame,right.frame,'bass',t),lowMid:numeric(left.frame,right.frame,'lowMid',t),
    mid:numeric(left.frame,right.frame,'mid',t),presence:numeric(left.frame,right.frame,'presence',t),
    air:numeric(left.frame,right.frame,'air',t),spectralFlux:numeric(left.frame,right.frame,'spectralFlux',t),
    spectralCentroid:numeric(left.frame,right.frame,'spectralCentroid',t),
    spectralFlatness:numeric(left.frame,right.frame,'spectralFlatness',t),
    zeroCrossingRate:numeric(left.frame,right.frame,'zeroCrossingRate',t),
    dynamicRange:numeric(left.frame,right.frame,'dynamicRange',t),
    rawLeftRmsDbfs:numeric(left.frame,right.frame,'rawLeftRmsDbfs',t,-120),
    rawRightRmsDbfs:numeric(left.frame,right.frame,'rawRightRmsDbfs',t,-120),
    rawMonoRmsDbfs:numeric(left.frame,right.frame,'rawMonoRmsDbfs',t,-120),
    rawMidRmsDbfs:numeric(left.frame,right.frame,'rawMidRmsDbfs',t,-120),
    rawSideRmsDbfs:numeric(left.frame,right.frame,'rawSideRmsDbfs',t,-120),
    rawPeakDbfs:numeric(left.frame,right.frame,'rawPeakDbfs',t,-120),
    rawClipFraction:numeric(left.frame,right.frame,'rawClipFraction',t),
    stereoCorrelation:numeric(left.frame,right.frame,'stereoCorrelation',t,1),
    monoCancellationRatio:numeric(left.frame,right.frame,'monoCancellationRatio',t),
    stereoWidth:numeric(left.frame,right.frame,'stereoWidth',t),
    leftRightBalance:numeric(left.frame,right.frame,'leftRightBalance',t),
    rawCrestFactor:numeric(left.frame,right.frame,'rawCrestFactor',t,1),
  }
}

export function visualLayerEnergy(frame:MusicDspPublicFrame,layer:MusicLayerName) {
  // In live DSP the legacy vocal lane is a physical mid/presence lane; no semantic classifier drives geometry.
  if(layer==='vocal') return clamp01(frame.mid*.60+frame.presence*.40)
  return clamp01(frame[layer])
}

export type AcousticVisualSample={
  layer:number;rms:number;peak:number;bass:number;lowMid:number;mid:number;presence:number;air:number
  flux:number;centroid:number;flatness:number;zcr:number;dynamic:number
  left:number;right:number;midStereo:number;side:number;stereoWidth:number;correlation:number
  balance:number;cancellation:number;crest:number;clip:number
}

export type AcousticVisualWindow={layer:MusicLayerName;current:AcousticVisualSample;history:AcousticVisualSample[]}

export function acousticVisualSample(frame:MusicDspPublicFrame,layer:MusicLayerName):AcousticVisualSample {
  const rms=clamp01(frame.rms)
  const left=dbToLinear(frame.rawLeftRmsDbfs,rms),right=dbToLinear(frame.rawRightRmsDbfs,rms)
  const midStereo=dbToLinear(frame.rawMidRmsDbfs??frame.rawMonoRmsDbfs,rms)
  const side=dbToLinear(frame.rawSideRmsDbfs,0)
  const inferredWidth=side/Math.max(1e-6,side+midStereo)
  const stereoWidth=clamp01(typeof frame.stereoWidth==='number'?frame.stereoWidth:inferredWidth)
  const balance=clamp(typeof frame.leftRightBalance==='number'?frame.leftRightBalance:(right-left)/Math.max(1e-6,right+left),-1,1)
  const rawCrest=typeof frame.rawCrestFactor==='number'?frame.rawCrestFactor:dbToLinear(frame.rawPeakDbfs,clamp01(frame.peak))/Math.max(.001,(left+right)*.5)
  return {
    layer:visualLayerEnergy(frame,layer),rms,peak:clamp01(frame.peak),
    bass:clamp01(frame.bass),lowMid:clamp01(frame.lowMid),mid:clamp01(frame.mid),presence:clamp01(frame.presence),air:clamp01(frame.air),
    flux:clamp01(frame.spectralFlux),centroid:clamp01((frame.spectralCentroid??0)/8000),
    flatness:clamp01(frame.spectralFlatness??0),zcr:clamp01((frame.zeroCrossingRate??0)*5),dynamic:clamp01(frame.dynamicRange??0),
    left,right,midStereo,side,stereoWidth,correlation:clamp(frame.stereoCorrelation??1,-1,1),balance,
    cancellation:clamp01(frame.monoCancellationRatio??0),crest:clamp01((rawCrest-1)/5),clip:clamp01((frame.rawClipFraction??0)*80),
  }
}

export function acousticVisualWindow({frames,endAt,layer,historyMs=1550}:{frames:BufferedMusicDspFrame[];endAt:number;layer:MusicLayerName;historyMs?:number}):AcousticVisualWindow|null {
  const currentFrame=sampleMusicDspFrameAt(frames,endAt)
  if(!currentFrame) return null
  const history=frames.filter(item=>item.receivedAt>=endAt-historyMs&&item.receivedAt<=endAt).map(item=>acousticVisualSample(item.frame,layer))
  const current=acousticVisualSample(currentFrame,layer)
  return {layer,current,history:history.length?history:[current]}
}
