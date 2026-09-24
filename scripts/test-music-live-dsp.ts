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

const mono=timeline(Array.from({length:18},()=>({
  rms:.52,peak:.70,bass:.62,spectralFlux:.24,
  rawMidRmsDbfs:-10,rawSideRmsDbfs:-48,stereoWidth:.02,leftRightBalance:0,
})))
const wide=timeline(Array.from({length:18},()=>({
  rms:.52,peak:.70,bass:.62,spectralFlux:.24,
  rawMidRmsDbfs:-10,rawSideRmsDbfs:-11,stereoWidth:.62,leftRightBalance:.16,
})))
const vocalLow=timeline(Array.from({length:18},()=>({
  rms:.48,peak:.66,mid:.68,presence:.72,spectralFlux:.20,vocalProbability:.05,
})))
const vocalHigh=timeline(Array.from({length:18},()=>({
  rms:.48,peak:.66,mid:.68,presence:.72,spectralFlux:.20,vocalProbability:.95,
})))
const bassStage=timeline(Array.from({length:18},()=>({
  rms:.62,peak:.78,bass:.92,lowMid:.58,mid:.22,presence:.14,air:.08,spectralFlux:.18,
})))
const trebleStage=timeline(Array.from({length:18},()=>({
  rms:.54,peak:.72,bass:.12,lowMid:.18,mid:.28,presence:.82,air:.94,spectralFlux:.26,
})))
const balancedStage=timeline(Array.from({length:18},()=>({
  rms:.56,peak:.72,bass:.50,lowMid:.50,mid:.50,presence:.50,air:.50,spectralFlux:.20,
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
const monoWave=liveDspWavePath({layer:'bass',frames:mono,...args})
const wideWave=liveDspWavePath({layer:'bass',frames:wide,...args})
const vocalLowWave=liveDspWavePath({layer:'vocal',frames:vocalLow,...args})
const vocalHighWave=liveDspWavePath({layer:'vocal',frames:vocalHigh,...args})
const bassStageBass=liveDspWavePath({layer:'bass',frames:bassStage,...args})
const bassStageAir=liveDspWavePath({layer:'air',frames:bassStage,...args})
const trebleStageBass=liveDspWavePath({layer:'bass',frames:trebleStage,...args})
const trebleStageAir=liveDspWavePath({layer:'air',frames:trebleStage,...args})
const balancedBass=liveDspWavePath({layer:'bass',frames:balancedStage,...args})
const balancedAir=liveDspWavePath({layer:'air',frames:balancedStage,...args})

assert(!quietWave.path.includes('NaN'),'quiet path contains NaN')
assert(!loudWave.path.includes('NaN'),'loud path contains NaN')
assert(loudWave.stats.gain>quietWave.stats.gain+.35,'DSP amplifier must visibly open loud input')
assert(quietWave.stats.crest===0,'quiet signal must not enter crest mode')
assert(climaxWave.stats.crest>.45,'relative final climax must enter crest mode')
assert(masteredWave.stats.crest<.08,'constant mastered signal must not remain in crest mode')
assert(loudWave.path!==midWave.path,'bass and mid must use distinct sine carriers')
assert(vocalWave.path!==midWave.path,'vocal and mid must use distinct sine carriers')
assert(fastWave.path===slowWave.path,'tempo metadata must not change live DSP geometry')
assert(wideWave.path!==monoWave.path,'stereo width must sculpt live DSP geometry')
assert(wideWave.stats.stereoWidth>monoWave.stats.stereoWidth+.4,'stereo signal bus must preserve width')
assert(vocalLowWave.path===vocalHighWave.path,'vocal classifier must not drive live DSP geometry')
assert(bassStageBass.stats.stage==='bass','bass-heavy spectrum must resolve bass-forward stage')
assert(bassStageBass.stats.stageLift>bassStageAir.stats.stageLift+.20,'bass-forward stage must lift bass above air')
assert(trebleStageAir.stats.stage==='treble','treble-heavy spectrum must resolve treble-forward stage')
assert(trebleStageAir.stats.stageLift>trebleStageBass.stats.stageLift+.20,'treble-forward stage must lift air above bass')
assert(balancedBass.stats.stage==='balanced','flat spectrum must resolve balanced stage')
assert(Math.abs(balancedBass.stats.stageLift-balancedAir.stats.stageLift)<.08,'balanced stage must keep band lifts near neutral')
assert(loudWave.path.startsWith('M 0 12'),'Live DSP carrier must start on the shared baseline')
assert(loudWave.path.endsWith(' 12.00'),'Live DSP carrier must return to the shared baseline')
assert(loudWave.path!==quietWave.path,'real DSP gain change must change geometry')

console.log('LIVE DSP AMPLIFIED SINE CONTRACT PASS')
console.log(JSON.stringify({
  quietGain:quietWave.stats.gain,
  loudGain:loudWave.stats.gain,
  climaxCrest:climaxWave.stats.crest,
  masteredCrest:masteredWave.stats.crest,
  slowMotion:slowWave.stats.motion,
  fastMotion:fastWave.stats.motion,
},null,2))
