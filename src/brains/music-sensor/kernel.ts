import type { LunaKernel } from '@/brains/core/luna-kernel'
import type { BrainEvidence, CortexDecision, HemisphereResult } from '@/brains/core/types'
import type { AcousticEarState, MusicCortexDecision, MusicSensorInput, SemanticEarState } from './types'

const now = () => new Date().toISOString()
const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

export const musicSensorKernel: LunaKernel<MusicSensorInput, SemanticEarState, AcousticEarState, MusicCortexDecision> = {
  left: {
    async observe(input, cycleId) {
      const genreVotes: Record<string, number> = {}
      for (const tag of input.tags ?? []) genreVotes[tag.name.toLowerCase()] = tag.weight
      const state: SemanticEarState = { genreVotes, styleVotes: { ...genreVotes }, identityConfidence: input.title && input.artist ? 0.9 : 0.2 }
      const evidence: BrainEvidence<SemanticEarState>[] = [{ source: 'metadata-tags', confidence: state.identityConfidence, observedAt: now(), value: state }]
      return { side: 'left', cycleId, evidence, summary: 'Semantic ear votes from identity and music metadata.' }
    },
  },
  right: {
    async observe(input, cycleId) {
      const a = input.audio
      const bands = a ? { bass: a.bass, lowMid: a.lowMid, mid: a.mid, presence: a.presence, air: a.air } : { bass: 0, lowMid: 0, mid: 0, presence: 0, air: 0 }
      const dominantBand = Object.entries(bands).sort((a, b) => b[1] - a[1])[0][0] as AcousticEarState['dominantBand']
      const state: AcousticEarState = { dominantBand, vocalProbability: a?.vocalProbability ?? 0, energy: a?.rms ?? 0, flux: a?.spectralFlux ?? 0 }
      return { side: 'right', cycleId, evidence: [{ source: 'local-dsp', confidence: a ? 0.95 : 0, observedAt: now(), value: state }], summary: 'Acoustic ear reads the signal that is actually playing.' }
    },
  },
  cortex: {
    async decide(left: HemisphereResult<SemanticEarState>, right: HemisphereResult<AcousticEarState>, cycleId: string) {
      const semantic = left.evidence[0]?.value
      const acoustic = right.evidence[0]?.value
      const top = semantic ? Object.entries(semantic.genreVotes).sort((a, b) => b[1] - a[1])[0]?.[0] : null
      const vocal = acoustic?.vocalProbability ?? 0
      const energy = acoustic?.energy ?? 0
      const state: MusicCortexDecision = {
        mode: acoustic && energy > 0.01 ? 'listening' : 'resting', genre: top ?? null, style: top ?? null,
        mood: energy > 0.7 ? 'intense' : energy > 0.3 ? 'alive' : 'calm',
        dominantLayer: vocal > 0.62 ? 'vocal' : acoustic?.dominantBand ?? 'mid',
        smoothing: clamp01(0.86 - energy * 0.35), attack: clamp01(0.28 + (acoustic?.flux ?? 0) * 0.5), release: clamp01(0.68 + (1 - energy) * 0.2),
      }
      const decision: CortexDecision<MusicCortexDecision> = { cycleId, confidence: clamp01(((left.evidence[0]?.confidence ?? 0) + (right.evidence[0]?.confidence ?? 0)) / 2), decidedAt: now(), state, rationaleTags: ['semantic-vote', 'acoustic-observation', 'cortex-fusion'] }
      return decision
    },
  },
  memory: { left: { learned: [], maxEntries: 4096 }, right: { learned: [], maxEntries: 4096 }, cortex: { learned: [], maxEntries: 2048 } },
}
