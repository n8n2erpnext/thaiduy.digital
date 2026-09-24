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
  // Low-mid is the warm body/bridge: fuller than mid, more articulate than bass.
  lowMid:{amp:1.38,cycle:.95,drift:1.08,swell:1.14,drive:.78,groove:1.18,pluck:.68,side:.88,edge:.82},
  mid:{amp:1.04,cycle:1.00,drift:.96,swell:1.02,drive:.92,groove:1.06,pluck:.84,side:.96,edge:.92},
  vocal:{amp:1.22,cycle:.98,drift:1.08,swell:1.18,drive:.76,groove:1.04,pluck:.68,side:1.04,edge:.78},
  presence:{amp:.96,cycle:1.03,drift:.88,swell:.90,drive:1.04,groove:1.02,pluck:.86,side:1.02,edge:1.05},
  air:{amp:.74,cycle:1.02,drift:.80,swell:.74,drive:.86,groove:.76,pluck:.90,side:1.10,edge:1.10},
}

function softSquare(value:number,sharpness:number){const drive=1.05+sharpness*2.15;return Math.tanh(value*drive)/(Math.tanh(drive)||1)}

export function renderAcousticVisualWave({layer,signal,controls,now,travelPhase,xStart,width,centerY,amplitude,points}:{layer:MusicLayerName;signal:AcousticVisualSample;controls:VisualAmpControls;now:number;travelPhase?:number;xStart:number;width:number;centerY:number;amplitude:number;points:number}) {
  const seconds=(now%120000)/1000,layerPhase=phase[layer],layerSeed=seed[layer]
  const character=layerCharacter[layer]
  // One conveyor clock owns every horizontal phase. Acoustic controls may
  // reshape/amplify the carrier, but they must never push it backwards.
  const transportPhase=typeof travelPhase==='number'?travelPhase:seconds*Math.PI*2*.34
  const clock=transportPhase
  const cycles=baseCycles[layer]*character.cycle
  const textureDensity=Math.max(0,Math.min(1,(controls.density-.68)/1.10))
  const motionTexture=.92+controls.motionRate*.10
  const signedStereo=controls.balance*.62
  const bloom=1+controls.glow*.12+controls.crest*.10+controls.stereoSpread*.08
  const visualAmp=amplitude*character.amp*(.07+controls.gain*1.28)*(1+controls.attack*.08)*(.90+controls.layerSpread*.10)*bloom
  const driftWeight=(.18+controls.roundness*.68*(1-controls.attack*.50))*character.drift
  const swellWeight=(.10+controls.dynamic*.58*(1-controls.attack*.42))*character.swell
  const driveWeight=(.08+controls.sharpness*.54+controls.attack*.22)*(1+textureDensity*.10)*character.drive
  const grooveWeight=(.08+controls.pulse*.62+controls.activity*.08)*motionTexture*character.groove
  const pluckWeight=(.06+controls.attack*.58*(.72+controls.roundness*.18))*(1+textureDensity*.08)*character.pluck
  const totalWeight=driftWeight+swellWeight+driveWeight+grooveWeight+pluckWeight
  const pathPoints:Array<[number,number]>=[]
  for(let i=0;i<=points;i++){
    const r=i/points,x=xStart+r*width,envelope=Math.pow(Math.sin(r*Math.PI),1.58)
    const theta=r*Math.PI*2*cycles+clock+layerPhase
    const phaseTexture=.34+.08*controls.phaseSpread
    const asymWarp=theta+controls.asymmetry*phaseTexture*Math.sin(theta*.47+layerSeed)+signedStereo*.14*Math.sin(theta*.31+layerPhase)
    const pulsePhase=theta*.82+layerSeed
    const pulseEnvelope=.68+.32*Math.pow(.5+.5*Math.sin(pulsePhase),1.26+textureDensity*.18)
    const drift=.64*Math.sin(theta*.72)+.24*Math.sin(theta*.31+layerSeed*.35)+.12*Math.cos(theta*1.18-layerSeed*.14)
    const swellShape=.50+.50*Math.pow(Math.sin(r*Math.PI),1.22)
    const swell=(.74*Math.sin(theta*.73)+.26*Math.sin(theta*1.46+layerSeed*.20))*swellShape
    const drive=.70*softSquare(Math.sin(asymWarp*1.26),controls.sharpness*character.edge)+.21*Math.sin(theta*3.05+layerSeed*.28)+.09*Math.sin(theta*4.8+layerSeed*.11)
    const pocket=.70+.30*Math.pow(.5+.5*Math.cos(pulsePhase+.8),1.52)
    const groove=(.62*Math.sin(asymWarp)+.27*Math.sin(theta*2.20+1.35)+.11*Math.cos(theta*4.24+layerSeed*.32))*pocket*(.90+.10*pulseEnvelope*controls.pulse)
    const phaseTurns=theta/(Math.PI*2)
    const segment=((phaseTurns*.55+layerSeed*.08)%1+1)%1,decay=.48+.52*Math.exp(-segment*(2.9+controls.attack*.8))
    const pluck=(.70*Math.sin(theta*1.16)+.22*Math.sin(theta*2.32+layerSeed*.30)+.08*Math.sin(theta*4.55))*decay
    let carrier=(drift*driftWeight+swell*swellWeight+drive*driveWeight+groove*grooveWeight+pluck*pluckWeight)/totalWeight
    carrier+=Math.sin(theta*.84+signedStereo*.9+layerSeed)*controls.stereoSpread*(.08+.10*signal.side)*character.side
    if(controls.crest>0) carrier+=Math.sin(theta*3.28+layerSeed*.21)*controls.crest*(.055+signal.flux*.07)
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
