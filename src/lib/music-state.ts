export type MusicMode = 'resting' | 'listening' | 'humming'

export type MusicLayer = {
  gain: number
  weight: number
}

export type MusicCortexState = {
  mode: MusicMode
  connected: boolean
  mood: string
  style: string
  dominantLayer: 'bass' | 'lowMid' | 'mid' | 'vocal' | 'presence' | 'air'
  energy: number
  layers: Record<'bass' | 'lowMid' | 'mid' | 'vocal' | 'presence' | 'air', MusicLayer>
}

export const restingMusicState: MusicCortexState = {
  mode: 'resting',
  connected: false,
  mood: 'unresolved',
  style: 'sensor not connected',
  dominantLayer: 'mid',
  energy: 0,
  layers: {
    bass: { gain: 0, weight: 0.2 }, lowMid: { gain: 0, weight: 0.35 },
    mid: { gain: 0, weight: 0.45 }, vocal: { gain: 0, weight: 0.1 },
    presence: { gain: 0, weight: 0.2 }, air: { gain: 0, weight: 0.15 },
  },
}
