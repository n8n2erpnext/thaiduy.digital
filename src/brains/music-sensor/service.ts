import { runLunaCycle } from '@/brains/core/luna-kernel'
import { getBrainProfile, recallBrainMemory, rememberBrainMemory, trimBrainMemory } from '@/brains/core/memory-store'
import { musicSensorKernel } from './kernel'
import type { MusicSensorInput, SemanticEarState } from './types'

const BRAIN_KEY = 'sentinel-music'

export function musicTrackMemoryKey(input: MusicSensorInput) {
  const cleanId = (value: string) => value.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 170)
  if (input.identity?.fingerprintId) return `recording:fingerprint:${cleanId(input.identity.fingerprintId)}`
  if (input.identity?.recordingMbid) return `recording:mbid:${cleanId(input.identity.recordingMbid)}`
  if (input.identity?.isrc) return `recording:isrc:${cleanId(input.identity.isrc)}`
  if (!input.artist || !input.title) return null
  const clean = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ')
  const duration = input.identity?.durationMs ? `:${Math.round(input.identity.durationMs / 1000)}s` : ''
  const version = input.identity?.versionLabel ? `:${cleanId(input.identity.versionLabel)}` : ''
  return `track:${clean(input.artist)}::${clean(input.title)}${duration}${version}`.slice(0, 220)
}

function memoryCap(config: Record<string, unknown>, key: string, fallback: number) {
  const value = Number(config[key])
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback
}

async function enrichFromSemanticMemory(input: MusicSensorInput) {
  if (input.semanticMode === 'disabled') return input
  if (input.tags?.length) return input
  const key = musicTrackMemoryKey(input)
  if (!key) return input
  const prior = await recallBrainMemory<SemanticEarState>(BRAIN_KEY, 'left', key)
  if (!prior) return input
  const combined = new Map<string, number>()
  for (const votes of [prior.value.genreVotes, prior.value.styleVotes, prior.value.moodVotes, prior.value.textureVotes, prior.value.arrangementVotes]) {
    for (const [name, weight] of Object.entries(votes)) combined.set(name, Math.max(combined.get(name) ?? 0, weight))
  }
  const tags = [...combined].map(([name, weight]) => ({ name, weight, source:'memory' as const }))
  return { ...input, tags }
}

export async function runMusicSensorLearningCycle(rawInput: MusicSensorInput) {
  const profile = await getBrainProfile(BRAIN_KEY)
  if (!profile?.enabled) return { enabled: false as const }

  const input = await enrichFromSemanticMemory(rawInput)
  const cycle = await runLunaCycle(musicSensorKernel, input)
  const key = musicTrackMemoryKey(input)
  const memoryConfig = profile.memoryConfig as Record<string, unknown>

  if (input.semanticMode !== 'disabled' && key && cycle.left.evidence[0]) {
    await rememberBrainMemory({
      brainKey: BRAIN_KEY,
      hemisphere: 'left',
      memoryKey: key,
      value: cycle.left.evidence[0].value,
      confidence: cycle.left.evidence[0].confidence,
    })
  }

  if (input.audio && cycle.right.evidence[0] && cycle.right.evidence[0].confidence > 0) {
    await rememberBrainMemory({
      brainKey: BRAIN_KEY,
      hemisphere: 'right',
      memoryKey: `signal:${cycle.cycleId}`,
      value: cycle.right.evidence[0].value,
      confidence: cycle.right.evidence[0].confidence,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })
  }
  await rememberBrainMemory({
    brainKey: BRAIN_KEY,
    hemisphere: 'cortex',
    memoryKey: key ?? `state:${cycle.cycleId}`,
    value: cycle.decision.state,
    confidence: cycle.decision.confidence,
    expiresAt: key ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  })

  await Promise.all([
    trimBrainMemory(BRAIN_KEY, 'left', memoryCap(memoryConfig, 'leftMax', 4096)),
    trimBrainMemory(BRAIN_KEY, 'right', memoryCap(memoryConfig, 'rightMax', 4096)),
    trimBrainMemory(BRAIN_KEY, 'cortex', memoryCap(memoryConfig, 'cortexMax', 2048)),
  ])

  return { enabled: true as const, ...cycle }
}
