export type MusicMeter = '2/4' | '3/4' | '4/4' | '6/8' | 'unknown'
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
  tempoBpm: number | null
  meter: MusicMeter
  performedStyleVotes: Record<string, number>
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
  performedStyle: string | null
  arrangement: string | null
  texture: string
  mood: string
  reinterpretation: boolean
  dominantLayer: 'bass' | 'lowMid' | 'mid' | 'vocal' | 'presence' | 'air'
  smoothing: number
  attack: number
  release: number
  layers: WaveLayers
}
