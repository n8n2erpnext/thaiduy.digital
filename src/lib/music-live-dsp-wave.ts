import type {
  BufferedMusicDspFrame,
  MusicDspPublicFrame,
  MusicLayerName,
} from '@/lib/music-state'

const clamp01=(value:number)=>Math.max(0,Math.min(1,value))
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t

const CONTROL_HISTORY_MS=1_150

const carrierCycles:Record<MusicLayerName,number>={
  bass:1.15,
  lowMid:1.55,
  mid:2.05,
  vocal:1.42,
  presence:2.75,
  air:3.55,
}

const carrierPhase:Record<MusicLayerName,number>={
  bass:.20,
  lowMid:1.10,
  mid:2.20,
  vocal:.70,
  presence:2.90,
  air:4.10,
}

const amplifierRange:Record<MusicLayerName,readonly [floor:number,ceiling:number,trim:number]>={
  bass:[.38,.98,.94],
  lowMid:[.30,.95,.98],
  mid:[.22,.90,1.00],
  vocal:[.22,.90,1.03],
  presence:[.14,.80,1.02],
  air:[.08,.72,.98],
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

function sampleAt(frames:BufferedMusicDspFrame[],at:number):MusicDspPublicFrame|null {
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
    tempoReliable:t<.5?left.frame.tempoReliable:right.frame.tempoReliable,
    pulseBpm:numeric('pulseBpm'),
    pulseConfidence:numeric('pulseConfidence'),
    pulseReliable:t<.5?left.frame.pulseReliable:right.frame.pulseReliable,
    tempoFamilyAgreement:t<.5?left.frame.tempoFamilyAgreement:right.frame.tempoFamilyAgreement,
    tempoOctaveAmbiguous:t<.5?left.frame.tempoOctaveAmbiguous:right.frame.tempoOctaveAmbiguous,
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
  return lo===hi?sorted[lo]:lerp(sorted[lo],sorted[hi],index-lo)
}

function mean(values:number[]) {
  return values.length?values.reduce((sum,value)=>sum+value,0)/values.length:0
}

function controlFrames(
  frames:BufferedMusicDspFrame[],
  endAt:number,
) {
  const start=endAt-CONTROL_HISTORY_MS
  return frames
    .filter(item=>item.receivedAt>=start&&item.receivedAt<=endAt)
    .map(item=>item.frame)
}

export type LiveDspWaveStats={
  activity:number
  crest:number
  latest:number
  baseline:number
  gain:number
  tempo:number
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
      stats:{activity:0,crest:0,latest:0,baseline:0,gain:0,tempo:0},
    }
  }

  const endAt=now-delayMs
  const current=sampleAt(frames,endAt)
  if(!current) {
    return {
      path:`M ${xStart} ${centerY} L ${xStart+width} ${centerY}`,
      stats:{activity:0,crest:0,latest:0,baseline:0,gain:0,tempo:0},
    }
  }

  const history=controlFrames(frames,endAt)
  const useful=history.length?history:[current]
  const layerHistory=useful.map(frame=>layerValue(frame,layer))
  const energyHistory=useful.map(frame=>clamp01(frame.rms))
  const fluxHistory=useful.map(frame=>clamp01(frame.spectralFlux))
  const driveHistory=useful.map((frame,index)=>clamp01(
    energyHistory[index]*.50
    +layerHistory[index]*.34
    +fluxHistory[index]*.16,
  ))

  const latest=layerValue(current,layer)
  const smoothLayer=mean(layerHistory.slice(-6))
  const smoothEnergy=mean(energyHistory.slice(-6))
  const smoothFlux=mean(fluxHistory.slice(-5))
  const dynamic=clamp01(current.dynamicRange??0)
  const percussive=clamp01(current.percussiveProbability??0)
  const harmonic=clamp01(current.harmonicProbability??0)

  // DSP acts as an amplifier/envelope, not as the geometry itself.
  // The nonlinear gain gives small source movement enough visual headroom while
  // preserving the measured loud/quiet relationship.
  const [inputFloor,inputCeiling,trim]=amplifierRange[layer]
  const sourceLevel=clamp01((smoothLayer-inputFloor)/(inputCeiling-inputFloor))
  const amplified=Math.pow(sourceLevel,.72)
  const energyAmp=Math.pow(clamp01((smoothEnergy-.025)/.93),.76)
  const gain=clamp01(
    (amplified*(.54+energyAmp*.34)+dynamic*.04)*trim,
  )

  const activity=clamp01(
    smoothEnergy*.50
    +smoothLayer*.34
    +dynamic*.10
    +smoothFlux*.06,
  )

  // Relative crest: a loud/mastered track does not remain permanently in climax.
  const baseline=quantile(driveHistory,.50)
  const high=quantile(driveHistory,.88)
  const crestRange=Math.max(.05,quantile(driveHistory,.98)-high)
  const crestSamples=driveHistory.map((drive,index)=>{
    const relative=clamp01((drive-Math.max(baseline+.05,high))/crestRange)
    const transient=clamp01((fluxHistory[index]-.07)/.34)
    return relative*(.58+.42*transient)
  })
  const crest=Math.max(0,...crestSamples)

  const reliablePulseFrames=useful.filter(frame=>
    frame.pulseReliable===true
    &&!!frame.pulseBpm
    &&frame.pulseBpm>=40
    &&frame.pulseBpm<=210
    &&(frame.pulseConfidence??0)>=.55,
  )
  const reliableTempoFrames=useful.filter(frame=>
    frame.tempoReliable!==false
    &&!!frame.tempoBpm
    &&frame.tempoBpm>=45
    &&frame.tempoBpm<=210
    &&(frame.beatConfidence??0)>=.46,
  )
  const movementConfidence=reliablePulseFrames.length
    ? mean(reliablePulseFrames.map(frame=>clamp01(frame.pulseConfidence??0)))
    : reliableTempoFrames.length
      ? mean(reliableTempoFrames.map(frame=>clamp01(frame.beatConfidence??0)))
      : clamp01(current.pulseConfidence??current.beatConfidence??0)
  const pulseValues=reliablePulseFrames
    .map(frame=>frame.pulseBpm??0)
    .filter(value=>value>0)
  const tempoValues=reliableTempoFrames
    .map(frame=>frame.tempoBpm??0)
    .filter(value=>value>0)
  const measuredTempo=pulseValues.length
    ? quantile(pulseValues,.5)
    : tempoValues.length
      ? quantile(tempoValues,.5)
      : 0
  // If neither pulse oracle nor exact tempo has a lock, movement still follows
  // measured transients/energy rather than semantic metadata.
  const tempo=measuredTempo
    ? measuredTempo
    : 58+smoothFlux*82+smoothEnergy*24

  const seconds=endAt/1000
  const beatHz=tempo/60
  const clock=seconds*Math.PI*2*beatHz*(.28+movementConfidence*.10)
  const temporalSlope=layerHistory.length>=2
    ? layerHistory[layerHistory.length-1]-layerHistory[Math.max(0,layerHistory.length-4)]
    : 0
  const attack=clamp01(Math.abs(temporalSlope)*2.8+smoothFlux*.72)

  const cycles=carrierCycles[layer]*(
    .90
    +movementConfidence*.08
    +smoothFlux*.12
  )
  const phase=carrierPhase[layer]+temporalSlope*1.35
  const visualAmp=amplitude*(.12+gain*1.10)*(1+attack*.10)

  let path=`M ${xStart} ${centerY}`
  for(let i=0;i<=points;i+=1) {
    const r=i/points
    const x=xStart+r*width
    const envelope=Math.pow(Math.sin(r*Math.PI),1.62)
    const theta=r*Math.PI*2*cycles+clock+phase

    const fundamental=Math.sin(theta)
    const second=Math.sin(theta*2+phase*.45)
    const third=Math.sin(theta*3-clock*.12)

    // Harmonic material stays round; percussive material gains a sharper edge.
    const harmonicMix=.92+harmonic*.08
    const edgeMix=percussive*(.10+.12*smoothFlux)
    let carrier=fundamental*harmonicMix+second*edgeMix+third*edgeMix*.28
    carrier=Math.tanh(carrier*(1+percussive*.32))/(Math.tanh(1+percussive*.32)||1)

    // Climax is only a resonance around the real DSP-controlled carrier.
    if(crest>0) {
      carrier+=Math.sin(theta*3.35+clock*.24)*crest*(.06+smoothFlux*.08)
    }

    const y=centerY+carrier*visualAmp*envelope
    path+=' L '+x.toFixed(2)+' '+y.toFixed(2)
  }

  return {
    path,
    stats:{activity,crest,latest,baseline,gain,tempo},
  }
}
