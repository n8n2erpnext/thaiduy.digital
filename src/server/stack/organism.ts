import 'server-only'

import { getRegistry } from '@/content/repository'
import { textFor } from '@/content/types'
import type { Locale } from '@/i18n/config'
import type { PublicOrganismState } from '@/lib/organism'
import { isFeatureEnabled } from '@/lib/feature-flags'
import { getLivePublicStackGraph } from '@/server/stack/public'
import { projectRuntimeFromStack } from '@/server/stack/projection'

type OrganismMeta = {
  x?:number
  y?:number
  roleEn?:string
  roleVi?:string
  importance?:number
  linksTo?:string[]
}

function meta(value: unknown): OrganismMeta | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as OrganismMeta
}

export async function getPublicOrganismState(locale: Locale): Promise<PublicOrganismState> {
  const [projects, organs, stack, musicEnabled] = await Promise.all([
    getRegistry('project'),
    getRegistry('organ'),
    getLivePublicStackGraph(),
    isFeatureEnabled('music.sensor', true),
  ])

  const runtime = await projectRuntimeFromStack(stack.graph)
  const items = [...projects, ...organs]
    .map(item => ({ item, organism:meta(item.meta?.organism) }))
    .filter((entry): entry is { item:typeof projects[number]; organism:OrganismMeta } =>
      !!entry.organism && typeof entry.organism.x === 'number' && typeof entry.organism.y === 'number')

  const nodes = items.map(({ item, organism }) => {
    let state: PublicOrganismState['nodes'][number]['state'] = 'offline'
    if (item.key === 'entity-core') state = 'online'
    else if (item.key === 'mb') state = 'private'
    else if (item.key === 'sentinel-music') state = musicEnabled ? 'private' : 'offline'
    else state = runtime[item.key]?.state ?? 'offline'

    return {
      id:item.key,
      label:textFor(item.label, locale),
      role:locale === 'vi'
        ? organism.roleVi ?? textFor(item.title, locale)
        : organism.roleEn ?? textFor(item.title, locale),
      state,
      x:organism.x ?? .5,
      y:organism.y ?? .5,
      importance:organism.importance ?? .7,
    }
  })

  const links = items.flatMap(({ item, organism }) =>
    (organism.linksTo ?? []).map(target => ({ source:item.key, target })))

  const runtimeByNode = new Map<string, string>()
  for (const projection of Object.values(runtime)) {
    for (const nodeId of projection.nodeIds) runtimeByNode.set(nodeId, projection.registryKey)
  }

  const labelById = new Map(nodes.map(node => [node.id, node.label]))
  const events = stack.graph.events.flatMap(event => {
    const sourceId = runtimeByNode.get(event.nodeId)
    if (!sourceId) return []
    const type = event.kind === 'node.state'
      ? 'runtime.state'
      : event.kind === 'node.added'
        ? 'runtime.added'
        : 'runtime.removed'
    return [{
      at:event.at,
      source:labelById.get(sourceId) ?? sourceId,
      state:event.to ?? event.from ?? 'unknown',
      type,
    } satisfies PublicOrganismState['events'][number]]
  }).slice(0, 12)

  const mode = nodes.some(node => node.state === 'degraded')
    ? 'degraded'
    : nodes.some(node => node.id !== 'entity-core' && node.state === 'online')
      ? 'active'
      : 'calm'

  return {
    mode,
    updatedAt:stack.graph.generatedAt,
    nodes,
    links,
    events,
  }
}
