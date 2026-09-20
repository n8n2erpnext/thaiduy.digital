import 'server-only'

import { and, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { runtimeBindings } from '@/db/schema'
import type {
  StackNodeState,
  StackPublicGraph,
  StackPublicNode,
} from '@/lib/stack-graph'

export type RuntimeProjection = {
  registryKey: string
  state: StackNodeState | 'offline'
  matchedCount: number
  onlineCount: number
  degradedCount: number
  updatedAt: string
  nodeIds: string[]
}

function stringList(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function nodeText(node: StackPublicNode) {
  return [
    node.id,
    node.label,
    node.project,
    node.service,
    node.role,
    node.group,
  ].filter(Boolean).join(' ').toLowerCase()
}

function matchNode(node: StackPublicNode, config: Record<string, unknown>) {
  const include = stringList(config.matchAny).map(item => item.toLowerCase())
  const exclude = stringList(config.excludeAny).map(item => item.toLowerCase())
  const text = nodeText(node)

  if (exclude.some(pattern => text.includes(pattern))) return false
  if (!include.length) return false
  return include.some(pattern => text.includes(pattern))
}

function summarizeState(nodes: StackPublicNode[]): RuntimeProjection['state'] {
  if (!nodes.length) return 'offline'
  if (nodes.some(node => node.state === 'degraded')) return 'degraded'
  if (nodes.some(node => node.state === 'online')) return 'online'
  if (nodes.some(node => node.state === 'paused')) return 'paused'
  if (nodes.some(node => node.state === 'private')) return 'private'
  return 'unknown'
}

export async function projectRuntimeFromStack(graph: StackPublicGraph) {
  const bindings = await db.select().from(runtimeBindings).where(and(
    eq(runtimeBindings.enabled, true),
    eq(runtimeBindings.source, 'stack.discovery'),
  ))

  return Object.fromEntries(bindings.map(binding => {
    const matches = graph.nodes.filter(node => matchNode(node, binding.config))
    const projection: RuntimeProjection = {
      registryKey:binding.registryKey,
      state:summarizeState(matches),
      matchedCount:matches.length,
      onlineCount:matches.filter(node => node.state === 'online').length,
      degradedCount:matches.filter(node => node.state === 'degraded').length,
      updatedAt:graph.generatedAt,
      nodeIds:matches.map(node => node.id),
    }
    return [binding.registryKey, projection]
  }))
}
