import type { MusicLayerName } from '@/lib/music-state'
import type { AcousticVisualSample } from '@/lib/music-visual-signal'
import type { VisualAmpControls } from '@/lib/music-visual-conditioner'

const baseCycles:Record<MusicLayerName,number>={bass:1.08,lowMid:1.42,mid:1.86,vocal:1.54,presence:2.42,air:3.08}
const phase:Record<MusicLayerName,number>={bass:.20,lowMid:1.10,mid:2.20,vocal:.70,presence:2.90,air:4.10}
const seed:Record<MusicLayerName,number>={bass:.37,lowMid:1.29,mid:2.17,vocal:.83,presence:2.73,air:4.31}

function softSquare(value:number,sharpness:number){const drive=1.05+sharpness*2.15;return Math.tanh(value*drive)/(Math.tanh(drive)||1)}

export function renderAcousticVisualWave({layer,signal,controls,now,xStart,width,centerY,amplitude,points}:{layer:MusicLayerName;signal:AcousticVisualSample;controls:VisualAmpControls;now:number;xStart:number;width:number;centerY:number;amplitude:number;points:number}) {
  const seconds=(now%120000)/1000,layerPhase=phase[layer],layerSeed=seed[layer]
  // Keep a continuous base clock. Acoustic motion modulates phase/density
  // locally instead of multiplying absolute time, which would cause phase jumps.
  const clock=seconds*Math.PI*2*.34+(controls.motionRate-.72)*.82+controls.attack*.16
  const cycles=baseCycles[layer]*controls.density*(.94+controls.motionRate*.06)
  const signedStereo=controls.balance*.62
  const visualAmp=amplitude*(.08+controls.gain*1.22)*(1+controls.attack*.08)*(.92+controls.layerSpread*.08)
  const driftWeight=.18+controls.roundness*.68*(1-controls.attack*.50)
  const swellWeight=.10+controls.dynamic*.58*(1-controls.attack*.42)
  const driveWeight=.08+controls.sharpness*.54+controls.attack*.22
  const grooveWeight=.08+controls.pulse*.62+controls.activity*.08
  const pluckWeight=.06+controls.attack*.58*(.72+controls.roundness*.18)
  const totalWeight=driftWeight+swellWeight+driveWeight+grooveWeight+pluckWeight
  let path='M '+xStart+' '+centerY
  for(let i=0;i<=points;i++){
    const r=i/points,x=xStart+r*width,envelope=Math.pow(Math.sin(r*Math.PI),1.58)
    const theta=r*Math.PI*2*cycles+clock+layerPhase*controls.phaseSpread+signedStereo*.12
    const asymWarp=theta+controls.asymmetry*.42*Math.sin(theta*.47+layerSeed)+signedStereo*.16*Math.sin(theta*.31+layerPhase)
    const pulsePhase=r*Math.PI*(4.3+controls.density*2.1)-clock*.58+layerSeed
    const pulseEnvelope=.68+.32*Math.pow(.5+.5*Math.sin(pulsePhase),1.35)
    const drift=.64*Math.sin(theta*.72)+.24*Math.sin(theta*.31+clock*.22+layerSeed*.35)+.12*Math.cos(theta*1.18-clock*.16)
    const swellShape=.50+.50*Math.pow(Math.sin(r*Math.PI),1.22)
    const swell=(.74*Math.sin(theta*.73)+.26*Math.sin(theta*1.46+layerSeed*.20))*swellShape
    const drive=.70*softSquare(Math.sin(asymWarp*1.26),controls.sharpness)+.21*Math.sin(theta*3.05+layerSeed*.28)+.09*Math.sin(theta*4.8-clock*.36)
    const pocket=.70+.30*Math.pow(.5+.5*Math.cos(pulsePhase+.8),1.52)
    const groove=(.62*Math.sin(asymWarp)+.27*Math.sin(theta*2.20+1.35)+.11*Math.cos(theta*4.24+layerSeed*.32))*pocket*(.90+.10*pulseEnvelope*controls.pulse)
    const segment=(r*3.45+clock*.055+layerSeed*.08)%1,decay=.48+.52*Math.exp(-segment*(2.9+controls.attack*.8))
    const pluck=(.70*Math.sin(theta*1.16)+.22*Math.sin(theta*2.32+layerSeed*.30)+.08*Math.sin(theta*4.55))*decay
    let carrier=(drift*driftWeight+swell*swellWeight+drive*driveWeight+groove*grooveWeight+pluck*pluckWeight)/totalWeight
    carrier+=Math.sin(theta*.84+signedStereo*.9+layerSeed)*controls.stereoSpread*(.08+.10*signal.side)
    if(controls.crest>0) carrier+=Math.sin(theta*3.28+clock*.21)*controls.crest*(.055+signal.flux*.07)
    carrier=Math.tanh(carrier*(1+controls.sharpness*.22))/(Math.tanh(1+controls.sharpness*.22)||1)
    const y=centerY+carrier*visualAmp*envelope
    path+=' L '+x.toFixed(2)+' '+y.toFixed(2)
  }
  return path
}
