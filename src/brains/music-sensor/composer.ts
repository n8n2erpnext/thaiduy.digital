import { recallBrainMemory, rememberBrainMemory } from '@/brains/core/memory-store'
import { persistHummingSketch } from './sketchbook'
import type { HummingComposition, HummingNote } from '@/lib/music-state'

export type HummingAfterglow = {
  at: number
  mood?: string
  genre?: string | null
  style?: string | null
  texture?: string
  dominantLayer?: string
  energy?: number
  swingness?: number
  meter?: '3/4' | '4/4'
  modeFamily?: string
}

type HummingPersonality = {
  generatedCount: number
  modes: Record<string, number>
  voices: Record<string, number>
  intervals: Record<string, number>
  cadences: Record<string, number>
  swingMean: number
  updatedAt: string
}

const BRAIN_KEY = 'sentinel-music'
const MEMORY_KEY = 'humming:personality-v1'
const NOTE_NAMES = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B']
const MODES: Record<string, number[]> = {
  'major-pentatonic':[0,2,4,7,9],
  'minor-pentatonic':[0,3,5,7,10],
  dorian:[0,2,3,5,7,9,10],
  mixolydian:[0,2,4,5,7,9,10],
  'natural-minor':[0,2,3,5,7,8,10],
  lydian:[0,2,4,6,7,9,11],
}

const ROOTS = [60,62,64,65,67,69,71]
const ROOT_LABELS = ['C','D','E','F','G','A','B']

function prng(seed:number) {
  let value = seed >>> 0
  return () => {
    value += 0x6D2B79F5
    let t=value
    t=Math.imul(t ^ t >>> 15, t | 1)
    t^=t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function clamp(value:number,min:number,max:number) { return Math.max(min,Math.min(max,value)) }
function noteName(midi:number) { return NOTE_NAMES[midi%12] + String(Math.floor(midi/12)-1) }
function modePool(mood:string, afterglow?:HummingAfterglow|null) {
  if (afterglow?.modeFamily && MODES[afterglow.modeFamily]) return [afterglow.modeFamily,'dorian','major-pentatonic']
  if (afterglow?.genre === 'jazz' || afterglow?.style?.includes('jazz')) return ['dorian','mixolydian','major-pentatonic']
  if (mood.includes('warm')) return ['dorian','major-pentatonic','mixolydian']
  if (mood.includes('intimate')) return ['minor-pentatonic','dorian','natural-minor']
  if (mood.includes('calm')) return ['major-pentatonic','dorian','lydian']
  return ['dorian','major-pentatonic','minor-pentatonic']
}

function weightedPreference(options:string[], counts:Record<string,number>, random:()=>number) {
  const weights=options.map(item => 1 + Math.log1p(counts[item] ?? 0))
  const total=weights.reduce((a,b)=>a+b,0)
  let target=random()*total
  for (let i=0;i<options.length;i+=1) {
    target-=weights[i]
    if (target<=0) return options[i]
  }
  return options[0]
}

async function loadPersonality():Promise<HummingPersonality> {
  const row=await recallBrainMemory<HummingPersonality>(BRAIN_KEY,'cortex',MEMORY_KEY)
  return row?.value ?? { generatedCount:0,modes:{},voices:{},intervals:{},cadences:{},swingMean:.12,updatedAt:new Date(0).toISOString() }
}

function strongest(record:Record<string,number>,fallback:string) {
  return Object.entries(record).sort((a,b)=>b[1]-a[1])[0]?.[0] ?? fallback
}

function buildNotes(seed:number, root:number, scale:number[], bars:number, beatsPerBar:number, personality:HummingPersonality) {
  const random=prng(seed ^ 0x51f15e)
  const totalBeats=bars*beatsPerBar
  const midpoint=totalBeats/2
  const learnedInterval=strongest(personality.intervals,'third')
  const motifSource=learnedInterval==='step' ? [0,1,2,1]
    : learnedInterval==='fifth' ? [0,4,2,4]
    : learnedInterval==='other' ? [0,3,1,4]
    : [0,2,1,3]
  const motif=motifSource.map(step => step % scale.length)
  const notes:HummingNote[]=[]
  let beat=0
  while (beat < totalBeats-.01) {
    const phrase=beat < midpoint ? 'question' : 'answer'
    const local=beat < midpoint ? beat : beat-midpoint
    const motifIndex=Math.floor(local*2)%motif.length
    let degree=motif[motifIndex]
    if (phrase==='answer') degree=(degree + (random()>.52 ? 1 : -1) + scale.length) % scale.length
    if (totalBeats-beat <= 1.01) degree=0
    let midi=root+scale[degree]
    if (random()>.78) midi += random()>.5 ? 12 : -12
    while (midi<55) midi+=12
    while (midi>79) midi-=12
    const candidate=beat+1.5<=totalBeats && random()>.72 ? 1.5 : random()>.38 ? 1 : .5
    const duration=Math.min(candidate,totalBeats-beat)
    const velocity=clamp(.42 + random()*.22 + (phrase==='answer'?.02:0),.35,.72)
    notes.push({ midi,name:noteName(midi),beat,duration,velocity,phrase })
    beat+=duration
  }
  if (notes.length>1) {
    const cadence=strongest(personality.cadences,'resolve-tonic')
    if (cadence==='descending-third' && notes.length>2) {
      const third=scale.find(step=>step===3 || step===4) ?? 3
      notes[notes.length-2]={ ...notes[notes.length-2],midi:root+third,name:noteName(root+third) }
    }
    notes[notes.length-1]={ ...notes[notes.length-1],midi:root,name:noteName(root) }
  }
  return notes
}
function progression(mode:string,bars:number) {
  const source = mode==='dorian' ? ['i','IV','i','VII']
    : mode==='mixolydian' ? ['I','♭VII','IV','I']
    : mode==='major-pentatonic' || mode==='lydian' ? ['I','IV','ii','V']
    : ['i','VI','III','VII']
  return Array.from({length:bars},(_,i)=>source[i%source.length])
}

function summarizeIntervals(notes:HummingNote[]) {
  const result:Record<string,number>={ step:0,third:0,fifth:0,other:0 }
  for (let i=1;i<notes.length;i+=1) {
    const distance=Math.abs(notes[i].midi-notes[i-1].midi)%12
    if (distance<=2) result.step+=1
    else if (distance===3 || distance===4) result.third+=1
    else if (distance===7) result.fifth+=1
    else result.other+=1
  }
  return result
}

async function rememberPersonality(previous:HummingPersonality, composition:HummingComposition) {
  const decay=(record:Record<string,number>) => Object.fromEntries(Object.entries(record).map(([k,v])=>[k,v*.97]))
  const modes=decay(previous.modes), voices=decay(previous.voices), intervals=decay(previous.intervals), cadences=decay(previous.cadences)
  modes[composition.mode]=(modes[composition.mode]??0)+1
  voices[composition.voice]=(voices[composition.voice]??0)+1
  for (const [key,value] of Object.entries(summarizeIntervals(composition.notes))) intervals[key]=(intervals[key]??0)+value
  const tail=composition.notes.slice(-2)
  const cadenceDistance=tail.length===2 ? tail[0].midi-tail[1].midi : 0
  const cadence=cadenceDistance===3 || cadenceDistance===4 ? 'descending-third' : 'resolve-tonic'
  cadences[cadence]=(cadences[cadence]??0)+1
  const next:HummingPersonality={ generatedCount:previous.generatedCount+1,modes,voices,intervals,cadences,
    swingMean:previous.swingMean*.92+composition.swing*.08,updatedAt:new Date().toISOString() }
  await rememberBrainMemory({ brainKey:BRAIN_KEY,hemisphere:'cortex',memoryKey:MEMORY_KEY,value:next,confidence:.82 })
}
export async function composeHumming(input:{ seed:number; startedAt:number; durationMs:number; mood:string; tempo:readonly [number,number]; swing:readonly [number,number]; afterglow?:HummingAfterglow|null }) {
  const personality=await loadPersonality()
  const random=prng(input.seed)
  const hour=(new Date(input.startedAt).getUTCHours()+7)%24
  const night=hour>=22 || hour<6
  const mode=weightedPreference(modePool(input.mood,input.afterglow),personality.modes,random)
  const meter: '3/4'|'4/4' = input.afterglow?.meter ?? (random()>.82 ? '3/4':'4/4')
  const beatsPerBar=meter==='3/4'?3:4
  const bars=2 + Math.floor(random()*3)
  const rootIndex=Math.floor(random()*ROOTS.length)
  const root=ROOTS[rootIndex]
  const minTempo=Math.max(48,input.tempo[0] || 56), maxTempo=Math.max(minTempo+1,input.tempo[1] || 84)
  const afterAge=Math.max(0,input.startedAt-(input.afterglow?.at ?? input.startedAt))
  const afterDecay=Math.exp(-afterAge/(4*60*60*1000))
  const afterEnergy=clamp((input.afterglow?.energy ?? .16)*afterDecay + .12*(1-afterDecay),0,1)
  let bpm=Math.round(minTempo + random()*(maxTempo-minTempo) + afterEnergy*8)
  if (night) bpm=Math.max(52,bpm-7)
  const voicePool:HummingComposition['voice'][] = night ? ['hum','breath','soft-synth'] : ['hum','whistle','soft-synth','breath']
  const voice=weightedPreference(voicePool,personality.voices,random) as HummingComposition['voice']
  const inheritedSwing=(input.afterglow?.swingness ?? personality.swingMean)*afterDecay + personality.swingMean*(1-afterDecay)
  const swing=clamp((input.swing[0]+input.swing[1])/2*.55 + inheritedSwing*.45,0,.55)
  const composition:HummingComposition={
    id:'hum-'+input.startedAt.toString(36)+'-'+input.seed.toString(36),
    title:'Idle sketch',
    seed:input.seed,bpm,meter,key:ROOT_LABELS[rootIndex],mode,bars,voice,swing,
    chordProgression:progression(mode,bars),notes:buildNotes(input.seed,root,MODES[mode]??MODES.dorian,bars,beatsPerBar,personality),
    startedAt:input.startedAt,generated:true,storedMelody:false,
  }
  const stored=await persistHummingSketch(composition)
  await rememberPersonality(personality,stored)
  return stored
}
