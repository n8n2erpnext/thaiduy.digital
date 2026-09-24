import type { MusicLayerName } from '@/lib/music-state'
import type { AcousticVisualWindow } from '@/lib/music-visual-signal'
import type { VisualAmpControls } from '@/lib/music-visual-conditioner'

const clamp=(value:number,min=0,max=1)=>Math.max(min,Math.min(max,value))
const clamp01=(value:number)=>clamp(value)

export type AcousticStageName='bass'|'mid'|'vocal'|'treble'|'balanced'
export type AcousticStageWeights=Record<AcousticStageName,number>

export type AcousticStageMix={
  weights:AcousticStageWeights
  dominant:AcousticStageName
  focus:number
}

const layerLift:Record<AcousticStageName,Record<MusicLayerName,number>>={
  bass:{bass:1.34,lowMid:1.16,mid:.92,vocal:.90,presence:.84,air:.78},
  mid:{bass:.88,lowMid:1.16,mid:1.30,vocal:1.12,presence:1.02,air:.86},
  vocal:{bass:.84,lowMid:.98,mid:1.18,vocal:1.34,presence:1.20,air:.92},
  treble:{bass:.76,lowMid:.84,mid:.98,vocal:1.02,presence:1.22,air:1.36},
  balanced:{bass:1,lowMid:1,mid:1,vocal:1,presence:1,air:1},
}

const names:AcousticStageName[]=['bass','mid','vocal','treble','balanced']

function sampleScores(sample:AcousticVisualWindow['current']) {
  return {
    bass:clamp01(sample.bass*.76+sample.lowMid*.24),
    mid:clamp01(sample.lowMid*.34+sample.mid*.66),
    vocal:clamp01(sample.mid*.44+sample.presence*.56),
    treble:clamp01(sample.presence*.38+sample.air*.62),
  }
}

function weightsFor(sample:AcousticVisualWindow['current']):AcousticStageWeights {
  const score=sampleScores(sample)
  const values=[score.bass,score.mid,score.vocal,score.treble]
  const max=Math.max(...values),min=Math.min(...values)
  const contrast=max>1e-6?clamp01((max-min)/max):0
  const shaped={
    bass:Math.pow(score.bass+.02,1.65),
    mid:Math.pow(score.mid+.02,1.65),
    vocal:Math.pow(score.vocal+.02,1.65),
    treble:Math.pow(score.treble+.02,1.65),
  }
  const balanced=Math.pow(1-contrast,1.35)*(.75+sample.rms*.25)+.04
  const total=shaped.bass+shaped.mid+shaped.vocal+shaped.treble+balanced
  return {
    bass:shaped.bass/total,mid:shaped.mid/total,vocal:shaped.vocal/total,
    treble:shaped.treble/total,balanced:balanced/total,
  }
}

export function resolveAcousticStage(window:AcousticVisualWindow):AcousticStageMix {
  const source=window.history.length?window.history:[window.current]
  const totals:AcousticStageWeights={bass:0,mid:0,vocal:0,treble:0,balanced:0}
  let weightTotal=0
  source.forEach((sample,index)=>{
    const recency=.35+.65*((index+1)/source.length)
    const w=weightsFor(sample)
    for(const name of names) totals[name]+=w[name]*recency
    weightTotal+=recency
  })
  const weights=Object.fromEntries(names.map(name=>[name,totals[name]/Math.max(1e-6,weightTotal)])) as AcousticStageWeights
  const ordered=names.map(name=>[name,weights[name]] as const).sort((a,b)=>b[1]-a[1])
  const dominant=ordered[0]?.[0]??'balanced'
  const audible=clamp01((window.current.rms-.02)/.18)
  const leadGap=Math.max(0,(ordered[0]?.[1]??0)-(ordered[1]?.[1]??0))
  const focus=dominant==='balanced'
    ? 0
    : clamp01((leadGap*2.25+Math.max(0,.48-weights.balanced)*.28)*audible)
  return {weights,dominant,focus}
}

export function applyAcousticStage(
  layer:MusicLayerName,
  controls:VisualAmpControls,
  stage:AcousticStageMix,
) {
  const lift=names.reduce((sum,name)=>sum+stage.weights[name]*layerLift[name][layer],0)
  const bass=stage.weights.bass,mid=stage.weights.mid,vocal=stage.weights.vocal,treble=stage.weights.treble
  return {
    controls:{
      ...controls,
      gain:clamp01(controls.gain*(.82+lift*.18)),
      density:clamp(controls.density+treble*.16+mid*.05-bass*.06,.68,1.78),
      sharpness:clamp01(controls.sharpness+treble*.14-bass*.06-vocal*.03),
      roundness:clamp01(controls.roundness+bass*.10+vocal*.08-treble*.05),
      phaseSpread:clamp(controls.phaseSpread+treble*.10+bass*.04,.76,1.82),
      layerSpread:clamp(controls.layerSpread+stage.focus*.08,.84,1.70),
      glow:clamp01(controls.glow+(lift-1)*.24+stage.focus*.05),
    },
    lift,
  }
}
