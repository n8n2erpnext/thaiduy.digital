export type MusicSensorInput = {
  artist?: string
  title?: string
  positionMs?: number
  tags?: Array<{ name: string; weight: number }>
  audio?: {
    rms: number
    bass: number
    lowMid: number
    mid: number
    presence: number
    air: number
    vocalProbability: number
    spectralFlux: number
  }
}

export type SemanticEarState = {
  genreVotes: Record<string, number>
  styleVotes: Record<string, number>
  identityConfidence: number
}

export type AcousticEarState = {
  dominantBand: 'bass' | 'lowMid' | 'mid' | 'presence' | 'air'
  vocalProbability: number
  energy: number
  flux: number
}

export type MusicCortexDecision = {
  mode: 'resting' | 'listening' | 'humming'
  genre: string | null
  style: string | null
  mood: string
  dominantLayer: 'bass' | 'lowMid' | 'mid' | 'vocal' | 'presence' | 'air'
  smoothing: number
  attack: number
  release: number
}
