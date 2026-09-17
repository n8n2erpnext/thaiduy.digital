import { runLunaCycle } from '@/brains/core/luna-kernel'
import { getBrainProfile, recallBrainMemory, rememberBrainMemory, trimBrainMemory } from '@/brains/core/memory-store'
import { musicSensorKernel } from './kernel'
import type { MusicSensorInput, SemanticEarState } from './types'

const BRAIN_KEY = 'sentinel-music'

function trackMemoryKey(input: MusicSensorInput) {
  if (!input.artist || !input.title) return null
  const clean = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ')
  return `track:${clean(input.artist)}::${clean(input.title)}`
}

function memoryCap(config: Record<string, unknown>, key: string, fallback: number) {
  const value = Number(config[key])
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback
}

async function enrichFromSemanticMemory(input: MusicSensorInput) {
  if (input.tags?.length) return input
  const key = trackMemoryKey(input)
  if (!key) return input
  const prior = await recallBrainMemory<SemanticEarState>(BRAIN_KEY, 'left', key)
  if (!prior) return input
  const tags = Object.entries(prior.value.genreVotes).map(([name, weight]) => ({ name, weight: weight * 0.9 }))
  return { ...input, tags }
}

export async function runMusicSensorLearningCycle(rawInput: MusicSensorInput) {
  const profile = await getBrainProfile(BRAIN_KEY)
  if (!profile?.enabled) return { enabled: false as const }

  const input = await enrichFromSemanticMemory(rawInput)
  const cycle = await runLunaCycle(musicSensorKernel, input)
  const key = trackMemoryKey(input)
  const memoryConfig = profile.memoryConfig as Record<string, unknown>

  if (key && cycle.left.evidence[0]) {
    await rememberBrainMemory({
      brainKey: BRAIN_KEY,
      hemisphere: 'left',
      memoryKey: key,
      value: cycle.left.evidence[0].value,
      confidence: cycle.left.evidence[0].confidence,
    })
  }

  if (cycle.right.evidence[0]) {
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
