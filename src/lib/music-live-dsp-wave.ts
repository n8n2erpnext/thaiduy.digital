import type {
  BufferedMusicDspFrame,
  MusicDspPublicFrame,
  MusicLayerName,
} from '@/lib/music-state'

const clamp01=(value:number)=>Math.max(0,Math.min(1,value))
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t

const LIVE_HISTORY_MS=1_450

const slopeGain:Record<MusicLayerName,number>={
  bass:.68,
  lowMid:.78,
  mid:.92,
  vocal:1,
  presence:1.12,
  air:1.24,
}

export const liveDspLayerColors={
  dark:{
    bass:'#72A6FF',
    lowMid:'#79C6FF',
    mid:'#A7D8FF',
    vocal:'#F6B35D',
    presence:'#F28C59',
    air:'#F5D07A',
  },
  normal:{
    bass:'#426CB4',
    lowMid:'#3C86B1',
    mid:'#5B91B2',
    vocal:'#B97026',
    presence:'#B95E3D',
    air:'#A9822D',
  },
} as const

function layerValue(frame:MusicDspPublicFrame,layer:MusicLayerName) {
  if(layer==='vocal') return clamp01(frame.vocalProbability??0)
  return clamp01(frame[layer])
}

function sampleAt(
  frames:BufferedMusicDspFrame[],
  at:number,
):MusicDspPublicFrame|null {
  if(!frames.length) return null
  if(at<=frames[0].receivedAt) return frames[0].frame
  const last=frames[frames.length-1]
  if(at>=last.receivedAt) return last.frame

  let lo=0
  let hi=frames.length-1
  while(lo+1<hi) {
    const mid=(lo+hi)>>1
    if(frames[mid].receivedAt<=at) lo=mid
    else hi=mid
  }

  const left=frames[lo]
  const right=frames[hi]
  const span=Math.max(1,right.receivedAt-left.receivedAt)
  const t=clamp01((at-left.receivedAt)/span)

  const numeric=(key:keyof MusicDspPublicFrame,fallback=0)=>{
    const a=left.frame[key]
    const b=right.frame[key]
    return lerp(
      typeof a==='number'?a:fallback,
      typeof b==='number'?b:fallback,
      t,
    )
  }

  return {
    ...left.frame,
    seq:t<.5?left.frame.seq:right.frame.seq,
    at:t<.5?left.frame.at:right.frame.at,
    rms:numeric('rms'),
    peak:numeric('peak'),
    bass:numeric('bass'),
    lowMid:numeric('lowMid'),
    mid:numeric('mid'),
    presence:numeric('presence'),
    air:numeric('air'),
    spectralFlux:numeric('spectralFlux'),
    spectralCentroid:numeric('spectralCentroid'),
    spectralFlatness:numeric('spectralFlatness'),
    zeroCrossingRate:numeric('zeroCrossingRate'),
    tempoBpm:numeric('tempoBpm'),
    beatConfidence:numeric('beatConfidence'),
    swingness:numeric('swingness'),
    percussiveProbability:numeric('percussiveProbability'),
    harmonicProbability:numeric('harmonicProbability'),
    dynamicRange:numeric('dynamicRange'),
    vocalProbability:numeric('vocalProbability'),
    meter:t<.5?left.frame.meter:right.frame.meter,
  }
}

function quantile(values:number[],q:number) {
  if(!values.length) return 0
  const sorted=[...values].sort((a,b)=>a-b)
  const index=(sorted.length-1)*clamp01(q)
  const lo=Math.floor(index)
  const hi=Math.ceil(index)
  if(lo===hi) return sorted[lo]
  return lerp(sorted[lo],sorted[hi],index-lo)
}

export type LiveDspWaveStats={
  activity:number
  crest:number
  latest:number
  baseline:number
}

export function liveDspWavePath({
  layer,
  frames,
  now,
  delayMs=900,
  xStart=0,
  width,
  centerY,
  amplitude,
  points=62,
}:{
  layer:MusicLayerName
  frames:BufferedMusicDspFrame[]
  now:number
  delayMs?:number
  xStart?:number
  width:number
  centerY:number
  amplitude:number
  points?:number
}):{path:string;stats:LiveDspWaveStats} {
  if(frames.length<2||!now) {
    return {
      path:`M ${xStart} ${centerY} L ${xStart+width} ${centerY}`,
      stats:{activity:0,crest:0,latest:0,baseline:0},
    }
  }

  const endAt=now-delayMs
  const startAt=endAt-LIVE_HISTORY_MS
  const samples:Array<{frame:MusicDspPublicFrame;value:number}>=[]
  for(let i=0;i<=points;i++) {
    const r=i/points
    const frame=sampleAt(frames,startAt+r*LIVE_HISTORY_MS)
    if(!frame) continue
    samples.push({frame,value:layerValue(frame,layer)})
  }

  if(samples.length<2) {
    return {
      path:`M ${xStart} ${centerY} L ${xStart+width} ${centerY}`,
      stats:{activity:0,crest:0,latest:0,baseline:0},
    }
  }

  const values=samples.map(sample=>sample.value)
  const drives=samples.map(sample=>clamp01(
    sample.frame.rms*.48
    +sample.value*.32
    +sample.frame.spectralFlux*.20,
  ))
  const baseline=quantile(drives,.50)
  const high=quantile(drives,.88)
  const crestThreshold=Math.max(baseline+.055,high)
  const crestRange=Math.max(.055,quantile(drives,.98)-crestThreshold)

  let maxActivity=0
  let maxCrest=0
  let path=''
  let previous=values[0]

  samples.forEach((sample,index)=>{
    const r=index/(samples.length-1)
    const x=xStart+r*width
    const frame=sample.frame
    const value=sample.value
    const energy=clamp01(frame.rms)
    const flux=clamp01(frame.spectralFlux)
    const percussive=clamp01(frame.percussiveProbability??0)
    const harmonic=clamp01(frame.harmonicProbability??0)
    const dynamic=clamp01(frame.dynamicRange??0)

    const slope=value-previous
    previous=value

    // Absolute measured layer level opens the lane. Temporal delta adds motion.
    // There is no autonomous oscillator or genre archetype in this contour.
    const absolute=(value-.50)*1.55
    const temporal=slope*slopeGain[layer]*2.25
    const sharpness=1+percussive*.55-harmonic*.20
    const contour=Math.tanh((absolute+temporal)*sharpness)

    const activity=clamp01(
      energy*.50
      +value*.34
      +dynamic*.10
      +flux*.06,
    )
    maxActivity=Math.max(maxActivity,activity)

    const energyScale=.24+energy*.76
    let offset=contour*amplitude*energyScale

    // Adaptive crest uses the local 88th-percentile zone. Mastered tracks with
    // consistently high normalized peaks therefore do not stay in "climax".
    const drive=drives[index]
    const relativeCrest=clamp01((drive-crestThreshold)/crestRange)
    const transientGate=clamp01((flux-.08)/.35)
    const crest=relativeCrest*(.55+.45*transientGate)
    maxCrest=Math.max(maxCrest,crest)

    if(crest>0) {
      const bpm=frame.tempoBpm&&frame.tempoBpm>0?frame.tempoBpm:90
      const cycles=4.5+percussive*6+clamp01((bpm-60)/140)*2.5
      const phase=(startAt+r*LIVE_HISTORY_MS)/1000
      const ripple=Math.sin(r*Math.PI*2*cycles+phase*(1.8+flux*3.4))
      offset+=ripple*amplitude*crest*(.055+flux*.085)
    }

    const edge=.62+.38*Math.pow(Math.sin(Math.PI*r),.34)
    const y=centerY+offset*edge
    path+=(index?' L ':'M ')+x.toFixed(2)+' '+y.toFixed(2)
  })

  return {
    path,
    stats:{
      activity:maxActivity,
      crest:maxCrest,
      latest:values[values.length-1]??0,
      baseline,
    },
  }
}
