import { classifyAcousticGenre, classifyAcousticInstrument } from '../src/brains/music-sensor/kernel'
import type { MusicSensorInput } from '../src/brains/music-sensor/types'

type Audio=NonNullable<MusicSensorInput['audio']>

const base:Audio={
  rms:.55,peak:.75,bass:.5,lowMid:.55,mid:.6,presence:.6,air:.5,
  vocalProbability:.2,spectralFlux:.35,spectralCentroid:2800,spectralFlatness:.3,
  zeroCrossingRate:.08,tempoBpm:110,beatConfidence:.65,meter:'4/4',swingness:.05,
  percussiveProbability:.5,harmonicProbability:.55,dynamicRange:.4,
}

function audio(patch:Partial<Audio>):Audio { return { ...base,...patch } }
function label(votes:Record<string,number>) { return Object.keys(votes)[0] ?? null }
function assert(value:unknown,message:string) { if(!value) throw new Error(message) }

const electronic=classifyAcousticGenre(audio({
  bass:.82,lowMid:.53,mid:.56,presence:.68,air:.74,vocalProbability:.18,
  percussiveProbability:.86,harmonicProbability:.40,spectralFlatness:.60,
  beatConfidence:.84,dynamicRange:.26,tempoBpm:128,
}))
assert(label(electronic.votes)==='electronic','electronic profile failed: '+JSON.stringify(electronic))

const classical=classifyAcousticGenre(audio({
  bass:.31,lowMid:.64,mid:.75,presence:.54,air:.48,vocalProbability:.08,
  percussiveProbability:.18,harmonicProbability:.89,spectralFlatness:.14,
  beatConfidence:.28,dynamicRange:.72,tempoBpm:96,
}))
assert(label(classical.votes)==='classical','classical profile failed: '+JSON.stringify(classical))

const hiphop=classifyAcousticGenre(audio({
  bass:.88,lowMid:.66,mid:.55,presence:.54,air:.36,vocalProbability:.66,
  percussiveProbability:.72,harmonicProbability:.34,spectralFlatness:.38,
  beatConfidence:.70,dynamicRange:.33,tempoBpm:88,
}))
assert(label(hiphop.votes)==='hip-hop','hip-hop profile failed: '+JSON.stringify(hiphop))

const voice=classifyAcousticInstrument(audio({
  vocalProbability:.91,mid:.76,presence:.73,harmonicProbability:.73,
  percussiveProbability:.22,spectralFlatness:.15,
}))
assert(label(voice.votes)==='voice','voice profile failed: '+JSON.stringify(voice))

const percussion=classifyAcousticInstrument(audio({
  vocalProbability:.03,percussiveProbability:.93,harmonicProbability:.17,
  presence:.82,air:.72,spectralFlatness:.72,zeroCrossingRate:.13,
}))
assert(label(percussion.votes)==='percussion','percussion profile failed: '+JSON.stringify(percussion))

const ambiguous=classifyAcousticGenre(audio({
  bass:.56,lowMid:.59,mid:.62,presence:.60,air:.52,vocalProbability:.42,
  percussiveProbability:.48,harmonicProbability:.52,spectralFlatness:.36,
  beatConfidence:.25,dynamicRange:.40,tempoBpm:108,
}))
assert(label(ambiguous.votes)===null,'ambiguous profile must remain unknown: '+JSON.stringify(ambiguous))

console.log('DSP V2 classifier contract PASS')
console.log(JSON.stringify({
  electronic:electronic.confidence,
  classical:classical.confidence,
  hiphop:hiphop.confidence,
  voice:voice.confidence,
  percussion:percussion.confidence,
},null,2))
