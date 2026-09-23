import type { LunaKernel } from '@/brains/core/luna-kernel'
import type { BrainEvidence, CortexDecision, HemisphereResult } from '@/brains/core/types'
import { classifyMusicTags, loadMusicAcousticArchetypes, loadMusicCortexPolicy, loadMusicSemanticKnowledge, sameMusicalFamily, topVote, waveHintFor } from './knowledge'
import type { AcousticEarState, MusicCortexDecision, MusicSensorInput, SemanticEarState, WaveLayers } from './types'

const now = () => new Date().toISOString()
const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

function numberField(source: Record<string, unknown> | undefined, key: string, fallback: number) {
  const value = Number(source?.[key])
  return Number.isFinite(value) ? value : fallback
}

function inferAcousticState(input: MusicSensorInput, archetypes: Record<string, unknown>[]): AcousticEarState {
  const a = input.audio
  const rules = new Map(archetypes.map(item => [String(item.id), item]))
  const bands = a
    ? { bass:a.bass, lowMid:a.lowMid, mid:a.mid, presence:a.presence, air:a.air }
    : { bass:0, lowMid:0, mid:0, presence:0, air:0 }
  const dominantBand = a ? Object.entries(bands).sort((x, y) => y[1] - x[1])[0][0] as AcousticEarState['dominantBand'] : 'mid'
  const votes: Record<string, number> = {}

  for (const [style, score] of Object.entries(a?.rhythmHints ?? {})) {
    const rule = rules.get(style)
    if (!rule || score == null) continue
    const min = numberField(rule, 'min', 0.55)
    if (score >= min) votes[style] = clamp01(score)
  }

  const swing = rules.get('swing')
  const swingness = a?.swingness ?? 0
  const beatConfidence = a?.beatConfidence ?? 0
  if (swing && swingness >= numberField(swing, 'min', 0.55) && beatConfidence >= numberField(swing, 'beatConfidenceMin', 0.45)) {
    votes.swing = Math.max(votes.swing ?? 0, clamp01(swingness * beatConfidence))
  }

  const waltz = rules.get('waltz')
  if (waltz && a?.meter === String(waltz.equals ?? '3/4') && beatConfidence >= numberField(waltz, 'beatConfidenceMin', 0.55)) {
    votes.waltz = Math.max(votes.waltz ?? 0, clamp01(beatConfidence * numberField(waltz, 'confidenceScale', 0.72)))
  }

  const ballad = rules.get('ballad')
  if (ballad && (a?.tempoBpm ?? 999) < numberField(ballad, 'maxTempo', 92) && (a?.vocalProbability ?? 0) > numberField(ballad, 'minVocal', 0.58) && (a?.rms ?? 1) < numberField(ballad, 'maxRms', 0.5)) {
    votes.ballad = Math.max(votes.ballad ?? 0, numberField(ballad, 'confidence', 0.45))
  }

  const vocalRule = rules.get('vocal-led')
  const instrumentalRule = rules.get('instrumental')
  const vocalMin = numberField(vocalRule, 'min', 0.64)
  const instrumentalMax = numberField(instrumentalRule, 'max', 0.15)
  const vocal = typeof a?.vocalProbability === 'number' ? clamp01(a.vocalProbability) : null
  const texture = !a || vocal === null
    ? 'mixed'
    : vocalRule && vocal >= vocalMin
      ? 'vocal-led'
      : instrumentalRule && vocal <= instrumentalMax
        ? 'instrumental'
        : 'mixed'
  return {
    bands, dominantBand, vocalProbability:vocal, energy:a?.rms ?? 0, flux:a?.spectralFlux ?? 0,
    tempoBpm:a?.tempoBpm ?? null, meter:a?.meter ?? 'unknown', performedStyleVotes:votes, texture,
    playbackActive:input.playback?.active ?? false, hasLiveAudio:!!a,
  }
}


function buildLayers(acoustic: AcousticEarState | undefined, style: string | null, catalog: string | null, arrangement: string | null, texture: string | null, nodes: Parameters<typeof waveHintFor>[1]): WaveLayers {
  const live = acoustic?.hasLiveAudio ?? false
  const base = {
    bass:live ? acoustic!.bands.bass : 0.2,
    lowMid:live ? acoustic!.bands.lowMid : 0.34,
    mid:live ? acoustic!.bands.mid : 0.46,
    vocal:live ? (acoustic!.vocalProbability ?? 0.05) : 0.26,
    presence:live ? acoustic!.bands.presence : 0.28,
    air:live ? acoustic!.bands.air : 0.18,
  }
  const hint = { ...waveHintFor(catalog, nodes), ...waveHintFor(style, nodes), ...waveHintFor(arrangement, nodes), ...waveHintFor(texture, nodes) }
  const make = (key: keyof WaveLayers) => {
    const semantic = hint[key] ?? base[key]
    const weight = live
      ? clamp01(base[key] * 0.78 + semantic * 0.22)
      : clamp01(Math.max(base[key], semantic))
    return { weight, gain: clamp01(0.35 + weight * 0.8) }
  }
  return {
    bass:make('bass'), lowMid:make('lowMid'), mid:make('mid'),
    vocal:make('vocal'), presence:make('presence'), air:make('air'),
  }
}

function moodFrom(semantic: SemanticEarState | undefined, acoustic: AcousticEarState | undefined, policy: Record<string, number>) {
  const tagged=semantic?topVote(semantic.moodVotes)?.[0]:null
  const hasLiveAudio=acoustic?.hasLiveAudio ?? false
  const energy=acoustic?.energy ?? 0

  if (hasLiveAudio && energy >= (policy.intenseEnergyMin ?? 0.72)) return 'intense'
  if (tagged) return tagged
  if (!hasLiveAudio) return 'unresolved'
  if (energy >= (policy.aliveEnergyMin ?? 0.38)) return 'alive'
  if (
    (acoustic?.vocalProbability ?? 0) >= (policy.intimateVocalMin ?? 0.68)
    && energy <= (policy.intimateEnergyMax ?? 0.38)
  ) return 'intimate'
  return 'calm'
}

function semanticCatalogGenre(semantic: SemanticEarState | undefined) {
  if (!semantic) return null
  return topVote(semantic.genreVotes)?.[0] ?? null
}
export const musicSensorKernel: LunaKernel<MusicSensorInput, SemanticEarState, AcousticEarState, MusicCortexDecision> = {
  left: {
    async observe(input, cycleId) {
      const knowledge = await loadMusicSemanticKnowledge()
      const classified = classifyMusicTags(input.tags ?? [], knowledge.nodes, knowledge.sourceWeights)
      const known = Object.keys(classified.genreVotes).length + Object.keys(classified.styleVotes).length
        + Object.keys(classified.moodVotes).length + Object.keys(classified.textureVotes).length + Object.keys(classified.arrangementVotes).length
      const identityConfidence = input.title && input.artist ? 0.92 : 0.35
      const strongest = Math.max(0, ...Object.values(classified.genreVotes), ...Object.values(classified.styleVotes), ...Object.values(classified.moodVotes), ...Object.values(classified.textureVotes), ...Object.values(classified.arrangementVotes))
      const classificationConfidence = known ? clamp01(0.45 + strongest * 0.5) : 0.1
      const semanticConfidence = clamp01(identityConfidence * 0.35 + classificationConfidence * 0.65)
      const state: SemanticEarState = { ...classified, identityConfidence, classificationConfidence }
      const evidence: BrainEvidence<SemanticEarState>[] = [{
        source:'semantic-knowledge-pack', confidence:semanticConfidence,
        observedAt:now(), value:state,
      }]
      return {
        side:'left', cycleId, evidence,
        summary:'Semantic ear separates genre, style, mood, texture and arrangement evidence.',
      }
    },
  },
  right: {
    async observe(input, cycleId) {
      const archetypes = await loadMusicAcousticArchetypes()
      const state = inferAcousticState(input, archetypes)
      const confidence = input.audio
        ? clamp01(0.6 + (input.audio.beatConfidence ?? 0) * 0.25 + (input.audio.rhythmHints ? 0.1 : 0))
        : 0
      return {
        side:'right', cycleId,
        evidence:[{ source:'local-dsp', confidence, observedAt:now(), value:state }],
        summary:'Acoustic ear describes the performance actually reaching the output device.',
      }
    },
  },
  cortex: {
    async decide(left: HemisphereResult<SemanticEarState>, right: HemisphereResult<AcousticEarState>, cycleId: string) {
      const semantic = left.evidence[0]?.value
      const acoustic = right.evidence[0]?.value
      const [policy, semanticKnowledge] = await Promise.all([loadMusicCortexPolicy(), loadMusicSemanticKnowledge()])
      const catalogGenre = semanticCatalogGenre(semantic)
      const catalogStyle = semantic ? topVote(semantic.styleVotes)?.[0] ?? null : null
      const acousticStyle = acoustic ? topVote(acoustic.performedStyleVotes) : null
      const performedStyle = acousticStyle && acousticStyle[1] >= (policy.styleOverrideMin ?? 0.55)
        ? acousticStyle[0]
        : catalogStyle
      const arrangement = semantic ? topVote(semantic.arrangementVotes)?.[0] ?? null : null
      const semanticTexture = semantic ? topVote(semantic.textureVotes)?.[0] ?? null : null
      const semanticTextureNode = semanticTexture ? semanticKnowledge.nodes.find(node => node.id === semanticTexture) : null
      const texture = acoustic?.texture === 'instrumental'
        ? semanticTextureNode?.family === 'instrumental' ? semanticTexture! : 'instrumental'
        : acoustic?.texture === 'vocal-led'
          ? semanticTextureNode?.family === 'vocal' ? semanticTexture! : 'vocal-led'
          : semanticTexture ?? acoustic?.texture ?? 'unknown'
      const referenceStyle = catalogStyle ?? catalogGenre
      const reinterpretation = !!(
        referenceStyle && performedStyle &&
        referenceStyle !== performedStyle &&
        !sameMusicalFamily(referenceStyle, performedStyle, semanticKnowledge.nodes)
      )
      const vocal = acoustic?.vocalProbability ?? 0
      const energy = acoustic?.energy ?? 0
      const layers = buildLayers(acoustic, performedStyle, catalogStyle ?? catalogGenre, arrangement, texture, semanticKnowledge.nodes)
      const semanticDominant = Object.entries(layers).sort((a,b) => b[1].weight - a[1].weight)[0][0] as MusicCortexDecision['dominantLayer']
      const dominantLayer = acoustic?.hasLiveAudio
        ? vocal >= (policy.vocalDominantMin ?? 0.64) ? 'vocal' : acoustic.dominantBand
        : semanticDominant
      const state: MusicCortexDecision = {
        mode:acoustic?.playbackActive || energy > 0.01 ? 'listening' : 'resting',
        catalogGenre, catalogStyle, performedStyle, arrangement, texture,
        mood:moodFrom(semantic, acoustic, policy), reinterpretation, dominantLayer,
        smoothing:clamp01((policy.smoothingBase ?? 0.84) - energy * (policy.smoothingEnergySlope ?? 0.3)),
        attack:clamp01((policy.attackBase ?? 0.24) + (acoustic?.flux ?? 0) * (policy.attackFluxGain ?? 0.55)),
        release:clamp01((policy.releaseBase ?? 0.66) + (1 - energy) * (policy.releaseQuietGain ?? 0.22)),
        layers,
      }
      const hasSemanticEvidence=!!semantic && [
        semantic.genreVotes,
        semantic.styleVotes,
        semantic.moodVotes,
        semantic.textureVotes,
        semantic.arrangementVotes,
      ].some(votes => Object.keys(votes).length > 0)
      const confidence = hasSemanticEvidence
        ? clamp01(((left.evidence[0]?.confidence ?? 0) + (right.evidence[0]?.confidence ?? 0)) / 2)
        : clamp01(right.evidence[0]?.confidence ?? 0)
      const decision: CortexDecision<MusicCortexDecision> = {
        cycleId,
        confidence,
        decidedAt:now(),
        state,
        rationaleTags:[
          'semantic-taxonomy',
          'acoustic-performance',
          reinterpretation ? 'reinterpretation-detected' : 'catalog-performance-compatible',
          arrangement ? `arrangement:${arrangement}` : 'arrangement:unknown',
          acoustic?.texture ? `texture:${acoustic.texture}` : 'texture:unknown',
        ],
      }
      return decision
    },
  },
  memory:{
    left:{ learned:[], maxEntries:4096 },
    right:{ learned:[], maxEntries:4096 },
    cortex:{ learned:[], maxEntries:2048 },
  },
}
