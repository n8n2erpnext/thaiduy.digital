import type { BufferedMusicDspFrame,MusicLayerName } from '@/lib/music-state'
import { acousticVisualWindow } from '@/lib/music-visual-signal'
import { conditionAcousticVisualSignal } from '@/lib/music-visual-conditioner'
import { renderAcousticVisualWave } from '@/lib/music-dsp-visual-grammar'

export const liveDspLayerColors={
  dark:{bass:'#72A6FF',lowMid:'#79C6FF',mid:'#A7D8FF',vocal:'#F6B35D',presence:'#F28C59',air:'#F5D07A'},
  normal:{bass:'#426CB4',lowMid:'#3C86B1',mid:'#5B91B2',vocal:'#B97026',presence:'#B95E3D',air:'#A9822D'},
} as const

export type LiveDspWaveStats={activity:number;crest:number;latest:number;baseline:number;gain:number;motion:number;stereoWidth:number;sharpness:number}

export function liveDspWavePath({layer,frames,now,delayMs=900,xStart=0,width,centerY,amplitude,points=62}:{layer:MusicLayerName;frames:BufferedMusicDspFrame[];now:number;delayMs?:number;xStart?:number;width:number;centerY:number;amplitude:number;points?:number}):{path:string;stats:LiveDspWaveStats} {
  const flat=()=>({
    path:'M '+xStart+' '+centerY+' L '+(xStart+width)+' '+centerY,
    stats:{activity:0,crest:0,latest:0,baseline:0,gain:0,motion:0,stereoWidth:0,sharpness:0},
  })
  if(frames.length<2||!now) return flat()
  const endAt=now-delayMs
  const window=acousticVisualWindow({frames,endAt,layer})
  if(!window) return flat()
  const controls=conditionAcousticVisualSignal(window)
  const path=renderAcousticVisualWave({layer,signal:window.current,controls,now:endAt,xStart,width,centerY,amplitude,points})
  return {
    path,
    stats:{activity:controls.activity,crest:controls.crest,latest:window.current.layer,baseline:controls.baseline,gain:controls.gain,motion:controls.motionRate,stereoWidth:controls.stereoSpread,sharpness:controls.sharpness},
  }
}
