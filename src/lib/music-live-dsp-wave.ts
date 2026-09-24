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
  // Acoustic spectrum palette: each physical band owns a distinct vivid hue,
  // while stage mixing below lets two strong regions blend like a duet.
  dark:{bass:'#5E9CFF',lowMid:'#4FD0C4',mid:'#8FDE84',vocal:'#FFD166',presence:'#FF7B91',air:'#C58BFF'},
  normal:{bass:'#2D6FD0',lowMid:'#088D82',mid:'#4B9346',vocal:'#C77A00',presence:'#C9415F',air:'#7A48B8'},
} as const

export type LiveDspWaveStats={
  activity:number;crest:number;latest:number;baseline:number;gain:number;motion:number
  stereoWidth:number;sharpness:number;glow:number;stageLift:number;stageFocus:number
  stage:AcousticStageName;stageWeights:AcousticStageWeights
}

type LiveDspTheme=keyof typeof liveDspLayerColors

export type LiveDspTravelClock={phase:number;bpm:number;lastAt:number}
const LIVE_DSP_TRAVEL_CYCLES_PER_BEAT=.18

export function createLiveDspTravelClock(initialBpm=96):LiveDspTravelClock {
  return {phase:0,bpm:initialBpm,lastAt:0}
}

export function advanceLiveDspTravelClock(
  clock:LiveDspTravelClock,
  now:number,
  tempoBpm:number|null|undefined,
) {
  const target=Math.max(55,Math.min(190,
    typeof tempoBpm==='number'&&Number.isFinite(tempoBpm)&&tempoBpm>0
      ? tempoBpm
      : clock.bpm||96,
  ))
  if(clock.lastAt<=0||now<=clock.lastAt) {
    clock.lastAt=now
    clock.bpm=target
    return clock.phase
  }

  const dt=Math.min(.08,Math.max(.001,(now-clock.lastAt)/1000))
  const alpha=1-Math.exp(-dt/.55)
  clock.bpm+=(target-clock.bpm)*alpha

  // Positive phase in sin(kx + phase) travels right -> left.
  clock.phase+=Math.PI*2*(clock.bpm/60)*LIVE_DSP_TRAVEL_CYCLES_PER_BEAT*dt
  const wrap=Math.PI*2*2048
  if(clock.phase>=wrap) clock.phase%=wrap
  clock.lastAt=now
  return clock.phase
}

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
const toHsl=(color:string)=>{
  const c=rgb(color),r=c.r/255,g=c.g/255,b=c.b/255
  const max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min
  const l=(max+min)/2
  if(delta===0)return{h:0,s:0,l}
  const s=delta/(1-Math.abs(2*l-1))
  let h=max===r?((g-b)/delta)%6:max===g?(b-r)/delta+2:(r-g)/delta+4
  h*=60
  if(h<0)h+=360
  return {h,s,l}
}
const fromHsl=(h:number,s:number,l:number)=>{
  const hue=((h%360)+360)%360,p=clamp01(s),light=clamp01(l)
  const c=(1-Math.abs(2*light-1))*p,x=c*(1-Math.abs((hue/60)%2-1)),m=light-c/2
  const value:[number,number,number]=
    hue<60?[c,x,0]:hue<120?[x,c,0]:hue<180?[0,c,x]:hue<240?[0,x,c]:hue<300?[x,0,c]:[c,0,x]
  return hex((value[0]+m)*255,(value[1]+m)*255,(value[2]+m)*255)
}
const mixVividHex=(a:string,b:string,t:number)=>{
  const aa=toHsl(a),bb=toHsl(b),p=clamp01(t)
  const delta=((bb.h-aa.h+540)%360)-180
  return fromHsl(
    aa.h+delta*p,
    aa.s+(bb.s-aa.s)*p,
    aa.l+(bb.l-aa.l)*p,
  )
}

export type LiveDspResolvedVisualTheme={
  dominantBand:MusicLayerName
  secondaryBand:MusicLayerName|null
  accentColor:string
  accentGlow:string
  supportColor:string
  barTrackColor:string
  barFillColors:Record<MusicLayerName,string>
}

const visualLayers:MusicLayerName[]=['bass','lowMid','mid','vocal','presence','air']

export function resolveLiveDspVisualTheme(
  theme:LiveDspTheme,
  layers:Record<MusicLayerName,{weight:number}>,
):LiveDspResolvedVisualTheme {
  const palette=liveDspLayerColors[theme]
  const ranked=visualLayers
    .map(layer=>[layer,clamp01(layers[layer]?.weight??0)] as const)
    .sort((a,b)=>b[1]-a[1])
  const dominantBand=ranked[0]?.[0]??'mid'
  const secondaryBand=ranked[1]?.[0]??null
  const dominantWeight=ranked[0]?.[1]??0
  const secondaryWeight=ranked[1]?.[1]??0
  const weakest=ranked[ranked.length-1]?.[1]??0
  const spread=dominantWeight-weakest
  const duetRatio=secondaryBand?secondaryWeight/Math.max(.001,dominantWeight):0
  const balanced=spread<.12

  const neutral=mixVividHex(palette.mid,palette.vocal,.42)
  const accentColor=balanced
    ? neutral
    : secondaryBand&&duetRatio>.72
      ? mixVividHex(palette[dominantBand],palette[secondaryBand],.40)
      : palette[dominantBand]
  const supportColor=secondaryBand?palette[secondaryBand]:neutral
  const barFillColors=Object.fromEntries(visualLayers.map(layer=>{
    const strength=clamp01(layers[layer]?.weight??0)
    const relative=dominantWeight>0?strength/dominantWeight:0
    const lead=layer===dominantBand ? 1 : layer===secondaryBand ? .72 : 0
    // Preserve each physical band's own hue. The stage accent should light the
    // ensemble, not wash six acoustic lanes into one pastel ribbon.
    const amount=balanced
      ? .07
      : Math.min(.34,.05+relative*.11+lead*.12)
    return [layer,mixVividHex(palette[layer],accentColor,amount)]
  })) as Record<MusicLayerName,string>

  return {
    dominantBand,
    secondaryBand,
    accentColor,
    accentGlow:accentColor,
    supportColor,
    barTrackColor:theme==='normal'?'rgba(24,34,30,.12)':'rgba(255,255,255,.055)',
    barFillColors,
  }
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
    bass:mixVividHex(palette.bass,palette.lowMid,.24),
    mid:mixVividHex(palette.lowMid,palette.mid,.54),
    vocal:mixVividHex(palette.vocal,palette.presence,.22),
    treble:mixVividHex(palette.presence,palette.air,.58),
    balanced:mixVividHex(palette.mid,palette.vocal,.42),
  }
  const ranked=(Object.keys(stageColors) as AcousticStageName[])
    .map(name=>[name,weights[name]] as const)
    .sort((a,b)=>b[1]-a[1])
  const lead=ranked[0]??['balanced',1] as const
  const second=ranked[1]??lead
  const duet=Math.min(.42,(second[1]/Math.max(.001,lead[1]+second[1]))*.86)
  const tint=second[1]>.10
    ? mixVividHex(stageColors[lead[0]],stageColors[second[0]],duet)
    : stageColors[lead[0]]
  const amount=Math.max(.08,Math.min(.62,.10+focus*.38+Math.max(0,lift-1)*.76))
  return mixVividHex(palette[layer],tint,amount)
}

export function liveDspWavePath({layer,frames,now,travelPhase=0,delayMs=900,xStart=0,width,centerY,amplitude,points=62}:{layer:MusicLayerName;frames:BufferedMusicDspFrame[];now:number;travelPhase?:number;delayMs?:number;xStart?:number;width:number;centerY:number;amplitude:number;points?:number}):{path:string;stats:LiveDspWaveStats} {
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
  const path=renderAcousticVisualWave({layer,signal:window.current,controls,now:endAt,travelPhase,xStart,width,centerY,amplitude,points})
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
