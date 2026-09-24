export type MusicMode = 'resting' | 'listening' | 'humming'
export type MusicSignal = 'offline' | 'semantic' | 'dsp'
export type MusicLayerName = 'bass' | 'lowMid' | 'mid' | 'vocal' | 'presence' | 'air'
export type MusicLayer = { gain: number; weight: number }

export type MusicPlaybackPublicSignal = {
  packageName: string
  artist: string
  title: string
  album?: string
  state: 'playing' | 'paused' | 'stopped' | 'buffering'
  positionMs?: number
  durationMs?: number
  at: string
}

export type HummingNote = {
  midi: number
  name: string
  beat: number
  duration: number
  velocity: number
  phrase: 'question' | 'answer'
}

export type HummingInstrument='piano'|'electric-piano'|'nylon-pluck'|'glass-fm'|'soft-synth'

export type HummingComposition = {
  id: string
  title: string
  seed: number
  bpm: number
  meter: '3/4' | '4/4'
  key: string
  mode: string
  bars: number
  voice: 'hum' | 'whistle' | 'soft-synth' | 'breath'
  instrument?: HummingInstrument
  ensemble?: {
    pad: 'warm-pad' | 'air-pad'
    bass: 'sub-bass' | 'soft-bass' | 'none'
    layers: 2 | 3
  }
  swing: number
  chordProgression: string[]
  notes: HummingNote[]
  startedAt: number
  sketchNumber?: number
  sketchbookMonth?: string
  generated: true
  storedMelody: false
}

export type BufferedMusicDspFrame = {
  receivedAt: number
  frame: MusicDspPublicFrame
}

export type MusicDspPublicFrame = {
  seq: number
  at: string
  windowMs: number
  rms: number
  peak: number
  bass: number
  lowMid: number
  mid: number
  presence: number
  air: number
  spectralFlux: number
  spectralCentroid?: number
  spectralFlatness?: number
  zeroCrossingRate?: number
  tempoBpm?: number
  tempoReliable?: boolean
  pulseBpm?: number
  pulseConfidence?: number
  pulseReliable?: boolean
  tempoFamilyAgreement?: 'direct'|'octave'|'conflict'|'none'
  tempoOctaveAmbiguous?: boolean
  beatConfidence?: number
  meter?: '2/4'|'3/4'|'4/4'|'6/8'|'12/8'|'unknown'
  swingness?: number
  percussiveProbability?: number
  harmonicProbability?: number
  dynamicRange?: number
  vocalProbability?: number
  rawLeftRmsDbfs?: number
  rawRightRmsDbfs?: number
  rawMonoRmsDbfs?: number
  rawMidRmsDbfs?: number
  rawSideRmsDbfs?: number
  rawPeakDbfs?: number
  rawClipFraction?: number
  stereoCorrelation?: number
  monoCancellationRatio?: number
  stereoWidth?: number
  leftRightBalance?: number
  rawCrestFactor?: number
}

export type MusicCortexState = {
  mode: MusicMode
  connected: boolean
  signal: MusicSignal
  track: null | {
    artist: string
    title: string
    url: string
    album?: string
    packageName?: string
  }
  genre: string | null
  style: string | null
  arrangement: string | null
  instrumentFamily?: string | null
  acousticGenreConfidence?: number
  instrumentConfidence?: number
  tempoBpm?: number | null
  beatConfidence?: number
  meter?: '2/4'|'3/4'|'4/4'|'6/8'|'12/8'|'unknown'
  swingness?: number
  percussiveProbability?: number
  harmonicProbability?: number
  dynamicRange?: number
  texture: string
  mood: string
  reinterpretation: boolean
  dominantLayer: MusicLayerName
  energy: number
  confidence: number
  layers: Record<MusicLayerName, MusicLayer>
  composition: HummingComposition | null
  updatedAt: string | null
  dspFrames?: BufferedMusicDspFrame[]
  dspVisualDelayMs?: number
}

export const restingMusicState: MusicCortexState = {
  mode:'resting', connected:false, signal:'offline', track:null,
  genre:null, style:null, arrangement:null, texture:'unknown', mood:'unresolved', reinterpretation:false,
  dominantLayer:'mid', energy:0, confidence:0, composition:null, updatedAt:null,
  layers:{
    bass:{ gain:0, weight:0.2 }, lowMid:{ gain:0, weight:0.35 }, mid:{ gain:0, weight:0.45 },
    vocal:{ gain:0, weight:0.1 }, presence:{ gain:0, weight:0.2 }, air:{ gain:0, weight:0.15 },
  },
}
