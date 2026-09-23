export type MusicMeter = '2/4' | '3/4' | '4/4' | '6/8' | '12/8' | 'unknown'
export type MusicTagSource = 'lastfm-track' | 'lastfm-artist' | 'musicbrainz' | 'listenbrainz' | 'memory' | 'heuristic' | 'unknown'
export type MusicSensorInput = {
  semanticMode?: 'enabled' | 'disabled'
  artist?: string
  title?: string
  positionMs?: number
  playback?: { active: boolean; source?: 'lastfm' | 'local' | 'unknown' }
  identity?: {
    fingerprintId?: string
    recordingMbid?: string
    isrc?: string
    releaseMbid?: string
    durationMs?: number
    versionLabel?: string
  }
  tags?: Array<{ name: string; weight: number; source?: MusicTagSource }>
  audio?: {
    rms: number
    peak?: number
    bass: number
    lowMid: number
    mid: number
    presence: number
    air: number
    vocalProbability?: number
    spectralFlux: number
    spectralCentroid?: number
    spectralFlatness?: number
    zeroCrossingRate?: number
    tempoBpm?: number
    beatConfidence?: number
    meter?: MusicMeter
    swingness?: number
    percussiveProbability?: number
    harmonicProbability?: number
    dynamicRange?: number
    rhythmHints?: Partial<Record<'swing'|'waltz'|'tango'|'bossa-nova'|'samba'|'straight', number>>
  }
}
export type SemanticEarState = {
  genreVotes: Record<string, number>
  styleVotes: Record<string, number>
  moodVotes: Record<string, number>
  textureVotes: Record<string, number>
  arrangementVotes: Record<string, number>
  contextConcepts: string[]
  unknownTags: string[]
  identityConfidence: number
  classificationConfidence: number
}

export type AcousticEarState = {
  bands: Record<'bass' | 'lowMid' | 'mid' | 'presence' | 'air', number>
  dominantBand: 'bass' | 'lowMid' | 'mid' | 'presence' | 'air'
  vocalProbability: number | null
  energy: number
  flux: number
  spectralFlatness: number
  zeroCrossingRate: number
  tempoBpm: number | null
  beatConfidence: number
  meter: MusicMeter
  swingness: number
  percussiveProbability: number
  harmonicProbability: number
  dynamicRange: number
  performedStyleVotes: Record<string, number>
  genreVotes: Record<string, number>
  instrumentVotes: Record<string, number>
  genreConfidence: number
  instrumentConfidence: number
  texture: 'vocal-led' | 'instrumental' | 'mixed'
  playbackActive: boolean
  hasLiveAudio: boolean
}

export type WaveLayerState = { weight: number; gain: number }
export type WaveLayers = Record<'bass'|'lowMid'|'mid'|'vocal'|'presence'|'air', WaveLayerState>
export type MusicCortexDecision = {
  mode: 'resting' | 'listening' | 'humming'
  catalogGenre: string | null
  catalogStyle: string | null
  acousticGenre: string | null
  acousticGenreConfidence: number
  performedStyle: string | null
  instrumentFamily: string | null
  instrumentConfidence: number
  arrangement: string | null
  texture: string
  mood: string
  reinterpretation: boolean
  dominantLayer: 'bass' | 'lowMid' | 'mid' | 'vocal' | 'presence' | 'air'
  tempoBpm: number | null
  beatConfidence: number
  meter: MusicMeter
  swingness: number
  percussiveProbability: number
  harmonicProbability: number
  dynamicRange: number
  smoothing: number
  attack: number
  release: number
  layers: WaveLayers
}
