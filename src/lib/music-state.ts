export type MusicMode = 'resting' | 'listening' | 'humming'
export type MusicSignal = 'offline' | 'semantic' | 'dsp'
export type MusicLayerName = 'bass' | 'lowMid' | 'mid' | 'vocal' | 'presence' | 'air'
export type MusicLayer = { gain: number; weight: number }

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
  vocalProbability?: number
}

export type MusicCortexState = {
  mode: MusicMode
  connected: boolean
  signal: MusicSignal
  track: null | { artist: string; title: string; url: string }
  genre: string | null
  style: string | null
  arrangement: string | null
  texture: string
  mood: string
  reinterpretation: boolean
  dominantLayer: MusicLayerName
  energy: number
  confidence: number
  layers: Record<MusicLayerName, MusicLayer>
  updatedAt: string | null
}

export const restingMusicState: MusicCortexState = {
  mode:'resting', connected:false, signal:'offline', track:null,
  genre:null, style:null, arrangement:null, texture:'unknown', mood:'unresolved', reinterpretation:false,
  dominantLayer:'mid', energy:0, confidence:0, updatedAt:null,
  layers:{
    bass:{ gain:0, weight:0.2 }, lowMid:{ gain:0, weight:0.35 }, mid:{ gain:0, weight:0.45 },
    vocal:{ gain:0, weight:0.1 }, presence:{ gain:0, weight:0.2 }, air:{ gain:0, weight:0.15 },
  },
}
