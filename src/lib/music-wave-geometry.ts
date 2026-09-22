import type { MusicExpression,MusicWaveArchetype } from '@/lib/music-expression'

type SampleInput={
  archetype:MusicWaveArchetype
  r:number
  clock:number
  phase:number
  frequency:number
  layerIndex:number
  seed:number
  motion:MusicExpression['motion']
}

const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value))

function softSquare(value:number,sharpness:number) {
  const drive=1.15+sharpness*2.3
  return Math.tanh(value*drive)/Math.tanh(drive)
}

function seededPhase(seed:number,layerIndex:number) {
  return (((seed>>>((layerIndex*4)%24))&15)/15)*Math.PI*2
}

export function musicWaveSample(input:SampleInput) {
  const {archetype,r,clock,phase,frequency,layerIndex,seed,motion}=input
  const seeded=seededPhase(seed,layerIndex)
  const theta=
    r*Math.PI*frequency*motion.density
    +clock
    +phase
    +seeded*.16
  const pulsePhase=r*Math.PI*(4.5+motion.density*2)-clock*.58+seeded*.3
  const pulseEnvelope=.66+.34*Math.pow(.5+.5*Math.sin(pulsePhase),1.35)
  const asymWarp=theta+motion.asymmetry*.48*Math.sin(theta*.47+seeded)

  let value=0
  switch(archetype){
    case 'drift':
      value=
        .64*Math.sin(theta*.72)
        +.24*Math.sin(theta*.31+clock*.22+seeded*.35)
        +.12*Math.cos(theta*1.18-clock*.16)
      break
    case 'swing':
      value=
        .56*Math.sin(asymWarp)
        +.3*Math.sin(theta*2.08+1.18+seeded*.24)
        +.14*Math.sin(theta*.52-clock*.3)
      value*=.84+.16*Math.sin(r*Math.PI*2+clock*.34)
      break
    case 'drive':
      value=
        .7*softSquare(Math.sin(theta*1.32),motion.sharpness)
        +.22*Math.sin(theta*3.18+seeded*.28)
        +.08*Math.sin(theta*5.1-clock*.4)
      break
    case 'pulse':
      value=
        (.78*Math.sin(theta*1.08)+.22*Math.sin(theta*2.16+seeded*.18))
        *(.68+.32*pulseEnvelope*motion.pulse)
      break
    case 'syncopated':{
      const sync=.54*Math.sin(asymWarp*1.08)
        +.31*Math.sin(theta*2.72+1.45)
        +.15*Math.sin(theta*4.65+seeded*.37)
      const accent=.72+.28*Math.pow(Math.max(0,Math.sin(pulsePhase+1.1)),1.6)
      value=sync*accent
      break
    }
    case 'swell':{
      const swell=.48+.52*Math.pow(Math.sin(r*Math.PI),1.25)
      value=
        (.74*Math.sin(theta*.73)+.26*Math.sin(theta*1.46+seeded*.2))
        *swell
      break
    }
    case 'groove':{
      const pocket=.7+.3*Math.pow(.5+.5*Math.cos(pulsePhase+.8),1.55)
      value=(
        .62*Math.sin(asymWarp)
        +.27*Math.sin(theta*2.24+1.35)
        +.11*Math.cos(theta*4.4+seeded*.32)
      )*pocket
      break
    }
    case 'pluck':{
      const segment=(r*3.5+clock*.055+seeded*.08)%1
      const decay=.5+.5*Math.exp(-segment*3.4)
      value=(
        .7*Math.sin(theta*1.18)
        +.22*Math.sin(theta*2.36+seeded*.3)
        +.08*Math.sin(theta*4.7)
      )*decay
      break
    }
  }

  return clamp(value,-1.35,1.35)
}

export function musicWaveArchetypeLabel(archetype:MusicWaveArchetype) {
  switch(archetype){
    case 'drift': return 'Drift'
    case 'swing': return 'Swing'
    case 'drive': return 'Drive'
    case 'pulse': return 'Pulse'
    case 'syncopated': return 'Syncopated'
    case 'swell': return 'Swell'
    case 'groove': return 'Groove'
    case 'pluck': return 'Pluck'
  }
}
