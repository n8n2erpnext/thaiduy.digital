import { liveDspWavePath } from '../src/lib/music-live-dsp-wave'
import type { BufferedMusicDspFrame,MusicDspPublicFrame } from '../src/lib/music-state'

function assert(value:unknown,message:string) {
  if(!value) throw new Error(message)
}

function frame(
  seq:number,
  patch:Partial<MusicDspPublicFrame>,
):MusicDspPublicFrame {
  return {
    seq,
    at:new Date(1_700_000_000_000+seq*100).toISOString(),
    windowMs:85,
    rms:.12,
    peak:.2,
    bass:.24,
    lowMid:.28,
    mid:.32,
    presence:.22,
    air:.16,
    spectralFlux:.18,
    vocalProbability:.12,
    ...patch,
  }
}

function timeline(
  patches:Array<Partial<MusicDspPublicFrame>>,
  start=10_000,
):BufferedMusicDspFrame[] {
  return patches.map((patch,index)=>({
    receivedAt:start+index*100,
    frame:frame(index+1,patch),
  }))
}

const quiet=timeline(
  Array.from({length:18},(_,index)=>({
    rms:.05+Math.sin(index*.5)*.006,
    peak:.10,
    bass:.18+Math.sin(index*.7)*.015,
    spectralFlux:.08,
  })),
)
const loudBass=timeline(
  Array.from({length:18},(_,index)=>{
    const hit=index%4===2
    return {
      rms:hit?.82:.32,
      peak:hit?.94:.46,
      bass:hit?.96:.38,
      mid:hit?.34:.28,
      spectralFlux:hit?.86:.20,
      percussiveProbability:hit?.88:.42,
      dynamicRange:.72,
      tempoBpm:132,
      beatConfidence:.82,
    }
  }),
)
const mastered=timeline(
  Array.from({length:18},()=>({
    rms:.88,
    peak:.98,
    bass:.78,
    mid:.70,
    spectralFlux:.10,
    percussiveProbability:.48,
    dynamicRange:.16,
  })),
)

const vocal=timeline(
  Array.from({length:18},(_,index)=>{
    const lift=index>5&&index<14
    return {
      rms:lift?.56:.24,
      peak:lift?.72:.34,
      vocalProbability:lift ? .72+Math.sin(index*.8)*.16 : .18,
      mid:lift?.70:.30,
      presence:lift?.76:.28,
      harmonicProbability:.78,
      spectralFlux:.30,
    }
  }),
)

const now=10_000+17*100+900
const quietWave=liveDspWavePath({
  layer:'bass',frames:quiet,now,width:104,centerY:12,amplitude:6.2,points:42,
})
const loudWave=liveDspWavePath({
  layer:'bass',frames:loudBass,now,width:104,centerY:12,amplitude:6.2,points:42,
})
const midWave=liveDspWavePath({
  layer:'mid',frames:loudBass,now,width:104,centerY:12,amplitude:6.2,points:42,
})
const vocalWave=liveDspWavePath({
  layer:'vocal',frames:vocal,now,width:104,centerY:12,amplitude:6.2,points:42,
})
const masteredWave=liveDspWavePath({
  layer:'bass',frames:mastered,now,width:104,centerY:12,amplitude:6.2,points:42,
})
const bassTopLane=liveDspWavePath({
  layer:'bass',frames:loudBass,now,width:104,centerY:3.2,amplitude:1.55,points:42,
})
const bassBottomLane=liveDspWavePath({
  layer:'bass',frames:loudBass,now,width:104,centerY:20.8,amplitude:1.55,points:42,
})

assert(!quietWave.path.includes('NaN'),'quiet path contains NaN')
assert(!loudWave.path.includes('NaN'),'loud path contains NaN')
assert(loudWave.stats.activity>quietWave.stats.activity+.25,'loud signal must create more activity')
assert(quietWave.stats.crest===0,'quiet signal must not enter crest mode')
assert(loudWave.stats.crest>.5,'relative climax must enter crest mode')
assert(masteredWave.stats.crest<.08,'constant mastered signal must not remain in crest mode')
assert(bassTopLane.path!==bassBottomLane.path,'live lanes must have distinct vertical geometry')
assert(loudWave.path!==midWave.path,'bass and mid must follow their own measured timelines')
assert(vocalWave.path!==midWave.path,'vocal must follow its own measured timeline')
assert(loudWave.path!==quietWave.path,'real signal change must change geometry')

console.log('LIVE DSP VISUAL CONTRACT PASS')
console.log(JSON.stringify({
  quietActivity:quietWave.stats.activity,
  loudActivity:loudWave.stats.activity,
  loudCrest:loudWave.stats.crest,
  vocalActivity:vocalWave.stats.activity,
  masteredCrest:masteredWave.stats.crest,
},null,2))
