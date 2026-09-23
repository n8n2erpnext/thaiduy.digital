import { liveDspWavePath } from '../src/lib/music-live-dsp-wave'
import type { BufferedMusicDspFrame,MusicDspPublicFrame } from '../src/lib/music-state'

function assert(value:unknown,message:string) {
  if(!value) throw new Error(message)
}

function frame(seq:number,patch:Partial<MusicDspPublicFrame>):MusicDspPublicFrame {
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

const quiet=timeline(Array.from({length:18},(_,index)=>({
  rms:.05+Math.sin(index*.5)*.006,
  peak:.10,
  bass:.18+Math.sin(index*.7)*.015,
  spectralFlux:.08,
  tempoBpm:92,
  beatConfidence:.7,
})))

const loud=timeline(Array.from({length:18},(_,index)=>({
  rms:.58+Math.sin(index*.45)*.05,
  peak:.72,
  bass:.76+Math.sin(index*.5)*.04,
  mid:.40,
  spectralFlux:.22,
  percussiveProbability:.58,
  harmonicProbability:.44,
  dynamicRange:.52,
  tempoBpm:118,
  beatConfidence:.82,
})))

const climax=timeline(Array.from({length:18},(_,index)=>{
  const final=index===17
  return {
    rms:final?.94:.50,
    peak:final?.98:.66,
    bass:final?.98:.68,
    mid:.42,
    spectralFlux:final?.92:.16,
    percussiveProbability:final?.90:.46,
    harmonicProbability:.42,
    dynamicRange:.64,
    tempoBpm:124,
    beatConfidence:.86,
  }
}))

const mastered=timeline(Array.from({length:18},()=>({
  rms:.88,
  peak:.98,
  bass:.78,
  mid:.70,
  spectralFlux:.10,
  percussiveProbability:.48,
  harmonicProbability:.46,
  dynamicRange:.16,
  tempoBpm:122,
  beatConfidence:.9,
})))

const vocal=timeline(Array.from({length:18},(_,index)=>({
  rms:.50,
  peak:.68,
  vocalProbability:.68+Math.sin(index*.55)*.12,
  mid:.70,
  presence:.76,
  harmonicProbability:.80,
  spectralFlux:.24,
  tempoBpm:104,
  beatConfidence:.76,
})))

const fast=timeline(Array.from({length:18},()=>({
  rms:.52,
  peak:.70,
  bass:.62,
  spectralFlux:.30,
  tempoBpm:156,
  beatConfidence:.92,
})))

const slow=timeline(Array.from({length:18},()=>({
  rms:.52,
  peak:.70,
  bass:.62,
  spectralFlux:.30,
  tempoBpm:78,
  beatConfidence:.92,
})))

const now=10_000+17*100+900
const args={now,width:104,centerY:12,amplitude:6.2,points:42} as const

const quietWave=liveDspWavePath({layer:'bass',frames:quiet,...args})
const loudWave=liveDspWavePath({layer:'bass',frames:loud,...args})
const climaxWave=liveDspWavePath({layer:'bass',frames:climax,...args})
const masteredWave=liveDspWavePath({layer:'bass',frames:mastered,...args})
const midWave=liveDspWavePath({layer:'mid',frames:loud,...args})
const vocalWave=liveDspWavePath({layer:'vocal',frames:vocal,...args})
const fastWave=liveDspWavePath({layer:'bass',frames:fast,...args})
const slowWave=liveDspWavePath({layer:'bass',frames:slow,...args})

assert(!quietWave.path.includes('NaN'),'quiet path contains NaN')
assert(!loudWave.path.includes('NaN'),'loud path contains NaN')
assert(loudWave.stats.gain>quietWave.stats.gain+.35,'DSP amplifier must visibly open loud input')
assert(quietWave.stats.crest===0,'quiet signal must not enter crest mode')
assert(climaxWave.stats.crest>.45,'relative final climax must enter crest mode')
assert(masteredWave.stats.crest<.08,'constant mastered signal must not remain in crest mode')
assert(loudWave.path!==midWave.path,'bass and mid must use distinct sine carriers')
assert(vocalWave.path!==midWave.path,'vocal and mid must use distinct sine carriers')
assert(fastWave.path!==slowWave.path,'measured tempo must change carrier motion')
assert(loudWave.path.startsWith('M 0 12'),'Live DSP carrier must start on the shared baseline')
assert(loudWave.path.endsWith(' 12.00'),'Live DSP carrier must return to the shared baseline')
assert(loudWave.path!==quietWave.path,'real DSP gain change must change geometry')

console.log('LIVE DSP AMPLIFIED SINE CONTRACT PASS')
console.log(JSON.stringify({
  quietGain:quietWave.stats.gain,
  loudGain:loudWave.stats.gain,
  climaxCrest:climaxWave.stats.crest,
  masteredCrest:masteredWave.stats.crest,
  slowTempo:slowWave.stats.tempo,
  fastTempo:fastWave.stats.tempo,
},null,2))
