import type { MusicLayerName } from '@/lib/music-state'
import type { AcousticVisualSample,AcousticVisualWindow } from '@/lib/music-visual-signal'

const clamp=(value:number,min=0,max=1)=>Math.max(min,Math.min(max,value))
const clamp01=(value:number)=>clamp(value)
const mean=(values:number[])=>values.length?values.reduce((sum,value)=>sum+value,0)/values.length:0

function quantile(values:number[],q:number) {
  if(!values.length) return 0
  const sorted=[...values].sort((a,b)=>a-b)
  const index=(sorted.length-1)*clamp01(q),lo=Math.floor(index),hi=Math.ceil(index)
  return lo===hi?sorted[lo]:sorted[lo]+(sorted[hi]-sorted[lo])*(index-lo)
}

const amplifierRange:Record<MusicLayerName,readonly [number,number,number]>={
  bass:[.18,.94,.98],lowMid:[.16,.92,1],mid:[.14,.90,1.02],vocal:[.14,.90,1.02],presence:[.10,.84,1],air:[.06,.76,.98],
}

export type VisualAmpControls={
  gain:number;activity:number;crest:number;baseline:number;attack:number;release:number;motionRate:number
  density:number;sharpness:number;roundness:number;asymmetry:number;pulse:number
  phaseSpread:number;layerSpread:number;stroke:number;glow:number;stereoSpread:number;balance:number;dynamic:number
}

function recent(history:AcousticVisualSample[],count:number){return history.slice(Math.max(0,history.length-count))}

export function conditionAcousticVisualSignal(window:AcousticVisualWindow):VisualAmpControls {
  const {layer,current,history}=window
  const short=recent(history,6),previous=history[Math.max(0,history.length-5)]??current
  const levels=history.map(sample=>sample.layer),energies=history.map(sample=>sample.rms),fluxes=history.map(sample=>sample.flux)
  const drives=history.map(sample=>clamp01(sample.rms*.46+sample.layer*.34+sample.flux*.14+sample.crest*.06))
  const smoothLevel=mean(short.map(sample=>sample.layer)),smoothEnergy=mean(short.map(sample=>sample.rms)),smoothFlux=mean(short.map(sample=>sample.flux))
  const [inputFloor,inputCeiling,trim]=amplifierRange[layer]
  const localFloor=Math.min(inputFloor,Math.max(0,quantile(levels,.18)-.04))
  const localCeiling=Math.max(inputCeiling*.72,quantile(levels,.92)+.08)
  const sourceLevel=clamp01((smoothLevel-localFloor)/Math.max(.12,localCeiling-localFloor))
  const energyAmp=Math.pow(clamp01((smoothEnergy-.018)/.82),.72)
  const gain=clamp01((Math.pow(sourceLevel,.67)*.72+energyAmp*.28)*trim)
  const layerSlope=current.layer-previous.layer,energySlope=current.rms-previous.rms
  const attack=clamp01(Math.max(0,layerSlope)*3.4+Math.max(0,energySlope)*3+smoothFlux*.68+current.crest*.14)
  const release=clamp01(Math.max(0,-layerSlope)*2.7+Math.max(0,-energySlope)*2.3+(1-smoothFlux)*.10)
  const baseline=quantile(drives,.50),high=quantile(drives,.88),crestRange=Math.max(.055,quantile(drives,.98)-high)
  const crest=Math.max(0,...drives.map((drive,index)=>{
    const relative=clamp01((drive-Math.max(baseline+.045,high))/crestRange)
    const transient=clamp01((fluxes[index]-.055)/.34)
    return relative*(.56+.44*transient)
  }))
  const motionRate=clamp(.46+smoothFlux*.62+Math.abs(layerSlope)*1.8+Math.abs(energySlope)*1.45+attack*.16,.42,1.58)
  const density=clamp(.78+current.centroid*.48+current.flatness*.18+(current.presence+current.air)*.12+current.side*.08,.72,1.66)
  const sharpness=clamp01(smoothFlux*.44+current.zcr*.18+current.air*.14+current.presence*.10+attack*.14)
  const roundness=clamp01(1-sharpness*.68-current.flatness*.16+current.lowMid*.10)
  const asymmetry=clamp01(current.stereoWidth*.40+Math.abs(current.balance)*.34+current.cancellation*.20+attack*.06)
  const pulse=clamp01(attack*.56+crest*.24+Math.max(0,energySlope)*1.1+smoothFlux*.18)
  const phaseSpread=clamp(.82+current.stereoWidth*.76+current.centroid*.16,.78,1.72)
  const layerSpread=clamp(.90+current.stereoWidth*.42+current.dynamic*.22+current.side*.16,.86,1.62)
  const stroke=clamp(1+gain*.25+crest*.24+attack*.08,1,1.58)
  const glow=clamp01(.10+gain*.24+crest*.30+current.stereoWidth*.10+attack*.08)
  const activity=clamp01(smoothEnergy*.42+smoothLevel*.32+smoothFlux*.12+current.dynamic*.08+current.stereoWidth*.06)
  return {gain,activity,crest,baseline,attack,release,motionRate,density,sharpness,roundness,asymmetry,pulse,phaseSpread,layerSpread,stroke,glow,stereoSpread:current.stereoWidth,balance:current.balance,dynamic:current.dynamic}
}
