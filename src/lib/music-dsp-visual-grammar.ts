import type { MusicLayerName } from '@/lib/music-state'
import type { AcousticVisualSample } from '@/lib/music-visual-signal'
import type { VisualAmpControls } from '@/lib/music-visual-conditioner'

const baseCycles:Record<MusicLayerName,number>={bass:1.08,lowMid:1.42,mid:1.86,vocal:1.54,presence:2.42,air:3.08}
const phase:Record<MusicLayerName,number>={bass:.20,lowMid:1.10,mid:2.20,vocal:.70,presence:2.90,air:4.10}
const seed:Record<MusicLayerName,number>={bass:.37,lowMid:1.29,mid:2.17,vocal:.83,presence:2.73,air:4.31}

const layerCharacter:Record<MusicLayerName,{
  amp:number;cycle:number;drift:number;swell:number;drive:number;groove:number;pluck:number;side:number;edge:number
}> = {
  // Bass is the broad physical foundation: larger body, slower contour and
  // less high-order edge. Other lanes remain neutral until tuned separately.
  bass:{amp:1.10,cycle:.90,drift:1.10,swell:1.16,drive:.68,groove:1.12,pluck:.60,side:.80,edge:.74},
  lowMid:{amp:1,cycle:1,drift:1,swell:1,drive:1,groove:1,pluck:1,side:1,edge:1},
  mid:{amp:1,cycle:1,drift:1,swell:1,drive:1,groove:1,pluck:1,side:1,edge:1},
  vocal:{amp:1,cycle:1,drift:1,swell:1,drive:1,groove:1,pluck:1,side:1,edge:1},
  presence:{amp:1,cycle:1,drift:1,swell:1,drive:1,groove:1,pluck:1,side:1,edge:1},
  air:{amp:1,cycle:1,drift:1,swell:1,drive:1,groove:1,pluck:1,side:1,edge:1},
}

function softSquare(value:number,sharpness:number){const drive=1.05+sharpness*2.15;return Math.tanh(value*drive)/(Math.tanh(drive)||1)}

export function renderAcousticVisualWave({layer,signal,controls,now,xStart,width,centerY,amplitude,points}:{layer:MusicLayerName;signal:AcousticVisualSample;controls:VisualAmpControls;now:number;xStart:number;width:number;centerY:number;amplitude:number;points:number}) {
  const seconds=(now%120000)/1000,layerPhase=phase[layer],layerSeed=seed[layer]
  const character=layerCharacter[layer]
  // Keep a continuous base clock. Acoustic motion modulates phase/density
  // locally instead of multiplying absolute time, which would cause phase jumps.
  const clock=seconds*Math.PI*2*.34+(controls.motionRate-.72)*.82+controls.attack*.16
  const cycles=baseCycles[layer]*character.cycle*controls.density*(.94+controls.motionRate*.06)
  const signedStereo=controls.balance*.62
  const bloom=1+controls.glow*.12+controls.crest*.10+controls.stereoSpread*.08
  const visualAmp=amplitude*character.amp*(.07+controls.gain*1.28)*(1+controls.attack*.08)*(.90+controls.layerSpread*.10)*bloom
  const driftWeight=(.18+controls.roundness*.68*(1-controls.attack*.50))*character.drift
  const swellWeight=(.10+controls.dynamic*.58*(1-controls.attack*.42))*character.swell
  const driveWeight=(.08+controls.sharpness*.54+controls.attack*.22)*character.drive
  const grooveWeight=(.08+controls.pulse*.62+controls.activity*.08)*character.groove
  const pluckWeight=(.06+controls.attack*.58*(.72+controls.roundness*.18))*character.pluck
  const totalWeight=driftWeight+swellWeight+driveWeight+grooveWeight+pluckWeight
  const pathPoints:Array<[number,number]>=[]
  for(let i=0;i<=points;i++){
    const r=i/points,x=xStart+r*width,envelope=Math.pow(Math.sin(r*Math.PI),1.58)
    const theta=r*Math.PI*2*cycles+clock+layerPhase*controls.phaseSpread+signedStereo*.12
    const asymWarp=theta+controls.asymmetry*.42*Math.sin(theta*.47+layerSeed)+signedStereo*.16*Math.sin(theta*.31+layerPhase)
    const pulsePhase=r*Math.PI*(4.3+controls.density*2.1)-clock*.58+layerSeed
    const pulseEnvelope=.68+.32*Math.pow(.5+.5*Math.sin(pulsePhase),1.35)
    const drift=.64*Math.sin(theta*.72)+.24*Math.sin(theta*.31+clock*.22+layerSeed*.35)+.12*Math.cos(theta*1.18-clock*.16)
    const swellShape=.50+.50*Math.pow(Math.sin(r*Math.PI),1.22)
    const swell=(.74*Math.sin(theta*.73)+.26*Math.sin(theta*1.46+layerSeed*.20))*swellShape
    const drive=.70*softSquare(Math.sin(asymWarp*1.26),controls.sharpness*character.edge)+.21*Math.sin(theta*3.05+layerSeed*.28)+.09*Math.sin(theta*4.8-clock*.36)
    const pocket=.70+.30*Math.pow(.5+.5*Math.cos(pulsePhase+.8),1.52)
    const groove=(.62*Math.sin(asymWarp)+.27*Math.sin(theta*2.20+1.35)+.11*Math.cos(theta*4.24+layerSeed*.32))*pocket*(.90+.10*pulseEnvelope*controls.pulse)
    const segment=(r*3.45+clock*.055+layerSeed*.08)%1,decay=.48+.52*Math.exp(-segment*(2.9+controls.attack*.8))
    const pluck=(.70*Math.sin(theta*1.16)+.22*Math.sin(theta*2.32+layerSeed*.30)+.08*Math.sin(theta*4.55))*decay
    let carrier=(drift*driftWeight+swell*swellWeight+drive*driveWeight+groove*grooveWeight+pluck*pluckWeight)/totalWeight
    carrier+=Math.sin(theta*.84+signedStereo*.9+layerSeed)*controls.stereoSpread*(.08+.10*signal.side)*character.side
    if(controls.crest>0) carrier+=Math.sin(theta*3.28+clock*.21)*controls.crest*(.055+signal.flux*.07)
    const edgeSharpness=controls.sharpness*character.edge
    carrier=Math.tanh(carrier*(1+edgeSharpness*.22))/(Math.tanh(1+edgeSharpness*.22)||1)
    const y=centerY+carrier*visualAmp*envelope
    pathPoints.push([x,y])
  }

  let path='M '+xStart+' '+centerY
  for(let i=1;i<pathPoints.length-1;i++){
    const point=pathPoints[i]
    const next=pathPoints[i+1]
    const midX=(point[0]+next[0])*.5
    const midY=(point[1]+next[1])*.5
    path+=' Q '+point[0].toFixed(2)+' '+point[1].toFixed(2)+' '+midX.toFixed(2)+' '+midY.toFixed(2)
  }
  const last=pathPoints[pathPoints.length-1]??[xStart+width,centerY]
  path+=' Q '+last[0].toFixed(2)+' '+last[1].toFixed(2)+' '+last[0].toFixed(2)+' '+last[1].toFixed(2)
  return path
}
