import { eq } from 'drizzle-orm'
import { rememberBrainMemory } from '@/brains/core/memory-store'
import { db } from '@/db/client'
import { brainProfiles } from '@/db/schema'
import { ACOUSTIC_ARCHETYPES, ACOUSTIC_FEATURE_KNOWLEDGE, CORTEX_MUSIC_POLICY, CORTEX_MUSIC_RULES, HUMMING_GRAMMARS, HUMMING_POLICY, MUSIC_KNOWLEDGE_VERSION, MUSIC_NODES, RECORDING_IDENTITY_RULES, SOURCE_WEIGHT } from './knowledge'

const brainKey = 'sentinel-music'

export async function seedDefaultMusicKnowledge() {
  for (const node of MUSIC_NODES) {
    await rememberBrainMemory({
      brainKey,
      hemisphere:'knowledge-left',
      memoryKey:`node:${node.id}`,
      value:{ version:MUSIC_KNOWLEDGE_VERSION, enabled:true, node },
      confidence:1,
    })
  }

  await rememberBrainMemory({
    brainKey,
    hemisphere:'knowledge-left',
    memoryKey:'source-weights',
    value:{ version:MUSIC_KNOWLEDGE_VERSION, enabled:true, weights:SOURCE_WEIGHT },
    confidence:1,
  })
  for (const item of ACOUSTIC_ARCHETYPES) {
    await rememberBrainMemory({
      brainKey,
      hemisphere:'knowledge-right',
      memoryKey:`archetype:${item.id}`,
      value:{ version:MUSIC_KNOWLEDGE_VERSION, enabled:true, archetype:item },
      confidence:1,
    })
  }

  await rememberBrainMemory({
    brainKey,
    hemisphere:'knowledge-cortex',
    memoryKey:'policy:thresholds',
    value:{ version:MUSIC_KNOWLEDGE_VERSION, enabled:true, policy:CORTEX_MUSIC_POLICY },
    confidence:1,
  })

  for (const feature of ACOUSTIC_FEATURE_KNOWLEDGE) {
    await rememberBrainMemory({
      brainKey, hemisphere:'knowledge-right', memoryKey:`feature:${feature.id}`,
      value:{ version:MUSIC_KNOWLEDGE_VERSION, enabled:true, feature }, confidence:1,
    })
  }

  await rememberBrainMemory({
    brainKey, hemisphere:'knowledge-cortex', memoryKey:'policy:humming',
    value:{ version:MUSIC_KNOWLEDGE_VERSION, enabled:true, policy:HUMMING_POLICY }, confidence:1,
  })
  for (const grammar of HUMMING_GRAMMARS) {
    await rememberBrainMemory({
      brainKey, hemisphere:'knowledge-cortex', memoryKey:`humming:${grammar.id}`,
      value:{ version:MUSIC_KNOWLEDGE_VERSION, enabled:true, grammar }, confidence:1,
    })
  }
  for (const [index, rule] of RECORDING_IDENTITY_RULES.entries()) {
    await rememberBrainMemory({
      brainKey, hemisphere:'knowledge-cortex', memoryKey:`identity-rule:${String(index + 1).padStart(2, '0')}`,
      value:{ version:MUSIC_KNOWLEDGE_VERSION, enabled:true, rule }, confidence:1,
    })
  }

  for (const [index, rule] of CORTEX_MUSIC_RULES.entries()) {
    await rememberBrainMemory({
      brainKey,
      hemisphere:'knowledge-cortex',
      memoryKey:`rule:${String(index + 1).padStart(2, '0')}`,
      value:{ version:MUSIC_KNOWLEDGE_VERSION, enabled:true, rule },
      confidence:1,
    })
  }

  const [profile] = await db.select().from(brainProfiles).where(eq(brainProfiles.brainKey, brainKey)).limit(1)
  if (profile) {
    const stamp = { knowledgeVersion:MUSIC_KNOWLEDGE_VERSION }
    await db.update(brainProfiles).set({
      leftConfig:{ ...(profile.leftConfig as Record<string, unknown>), ...stamp },
      rightConfig:{ ...(profile.rightConfig as Record<string, unknown>), ...stamp },
      cortexConfig:{ ...(profile.cortexConfig as Record<string, unknown>), ...stamp },
      updatedAt:new Date(),
    }).where(eq(brainProfiles.brainKey, brainKey))
  }
  return {
    version:MUSIC_KNOWLEDGE_VERSION,
    left:MUSIC_NODES.length + 1,
    right:ACOUSTIC_ARCHETYPES.length + ACOUSTIC_FEATURE_KNOWLEDGE.length,
    cortex:CORTEX_MUSIC_RULES.length + RECORDING_IDENTITY_RULES.length + HUMMING_GRAMMARS.length + 2,
  }
}
