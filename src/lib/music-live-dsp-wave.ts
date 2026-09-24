import type { BufferedMusicDspFrame,MusicLayerName } from '@/lib/music-state'
import { acousticVisualWindow } from '@/lib/music-visual-signal'
import { conditionAcousticVisualSignal } from '@/lib/music-visual-conditioner'
import { renderAcousticVisualWave } from '@/lib/music-dsp-visual-grammar'
import {
  applyAcousticStage,
  resolveAcousticStage,
  type AcousticStageName,
  type AcousticStageWeights,
} from '@/lib/music-acoustic-stage'

export const liveDspLayerColors={
  dark:{bass:'#72A6FF',lowMid:'#79C6FF',mid:'#A7D8FF',vocal:'#F6B35D',presence:'#F28C59',air:'#F5D07A'},
  normal:{bass:'#426CB4',lowMid:'#3C86B1',mid:'#5B91B2',vocal:'#B97026',presence:'#B95E3D',air:'#A9822D'},
} as const

export type LiveDspWaveStats={
  activity:number;crest:number;latest:number;baseline:number;gain:number;motion:number
  stereoWidth:number;sharpness:number;glow:number;stageLift:number;stageFocus:number
  stage:AcousticStageName;stageWeights:AcousticStageWeights
}

type LiveDspTheme=keyof typeof liveDspLayerColors

const clamp01=(value:number)=>Math.max(0,Math.min(1,value))
const rgb=(hex:string)=>({
  r:parseInt(hex.slice(1,3),16),
  g:parseInt(hex.slice(3,5),16),
  b:parseInt(hex.slice(5,7),16),
})
const hex=(r:number,g:number,b:number)=>'#'+[r,g,b]
  .map(value=>Math.round(Math.max(0,Math.min(255,value))).toString(16).padStart(2,'0'))
  .join('')
const mixHex=(a:string,b:string,t:number)=>{
  const aa=rgb(a),bb=rgb(b),p=clamp01(t)
  return hex(aa.r+(bb.r-aa.r)*p,aa.g+(bb.g-aa.g)*p,aa.b+(bb.b-aa.b)*p)
}

export function liveDspStageLayerColor(
  theme:LiveDspTheme,
  layer:MusicLayerName,
  weights:AcousticStageWeights,
  focus:number,
  lift:number,
) {
  const palette=liveDspLayerColors[theme]
  const stageColors={
    bass:mixHex(palette.bass,palette.lowMid,.32),
    mid:mixHex(palette.lowMid,palette.mid,.58),
    vocal:mixHex(palette.vocal,palette.presence,.30),
    treble:mixHex(palette.presence,palette.air,.58),
    balanced:mixHex(palette.mid,palette.vocal,.45),
  }
  const entries=(Object.keys(stageColors) as AcousticStageName[])
  const weighted=entries.reduce((acc,name)=>{
    const c=rgb(stageColors[name]),w=weights[name]
    return {r:acc.r+c.r*w,g:acc.g+c.g*w,b:acc.b+c.b*w}
  },{r:0,g:0,b:0})
  const tint=hex(weighted.r,weighted.g,weighted.b)
  const amount=Math.max(.04,Math.min(.48,.07+focus*.24+Math.max(0,lift-1)*.72))
  return mixHex(palette[layer],tint,amount)
}

export function liveDspWavePath({layer,frames,now,delayMs=900,xStart=0,width,centerY,amplitude,points=62}:{layer:MusicLayerName;frames:BufferedMusicDspFrame[];now:number;delayMs?:number;xStart?:number;width:number;centerY:number;amplitude:number;points?:number}):{path:string;stats:LiveDspWaveStats} {
  const flat=():{path:string;stats:LiveDspWaveStats}=>({
    path:'M '+xStart+' '+centerY+' L '+(xStart+width)+' '+centerY,
    stats:{
      activity:0,crest:0,latest:0,baseline:0,gain:0,motion:0,stereoWidth:0,sharpness:0,glow:0,
      stageLift:1,stageFocus:0,stage:'balanced',
      stageWeights:{bass:0,mid:0,vocal:0,treble:0,balanced:1},
    },
  })
  if(frames.length<2||!now) return flat()
  const endAt=now-delayMs
  const window=acousticVisualWindow({frames,endAt,layer})
  if(!window) return flat()
  const baseControls=conditionAcousticVisualSignal(window)
  const stage=resolveAcousticStage(window)
  const staged=applyAcousticStage(layer,baseControls,stage)
  const controls=staged.controls
  const path=renderAcousticVisualWave({layer,signal:window.current,controls,now:endAt,xStart,width,centerY,amplitude,points})
  return {
    path,
    stats:{
      activity:controls.activity,crest:controls.crest,latest:window.current.layer,
      baseline:controls.baseline,gain:controls.gain,motion:controls.motionRate,
      stereoWidth:controls.stereoSpread,sharpness:controls.sharpness,glow:controls.glow,
      stageLift:staged.lift,stageFocus:stage.focus,stage:stage.dominant,stageWeights:stage.weights,
    },
  }
}
