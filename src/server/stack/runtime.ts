import 'server-only'

import { randomUUID } from 'node:crypto'
import { ensureRedis } from '@/lib/redis'
import type {
  StackPublicGraph,
  StackRuntimeEvent,
} from '@/lib/stack-graph'

const SNAPSHOT_KEY = 'stack:atlas:public:last'
const EVENTS_KEY = 'stack:atlas:events'
const HISTORY_STARTED_KEY = 'stack:atlas:history:started'
const SNAPSHOT_TTL_SECONDS = 60 * 60 * 24 * 7
const EVENT_LIMIT = 1000

function nodeMap(graph: StackPublicGraph) {
  return new Map(graph.nodes.map(node => [node.id, node]))
}

function diffGraphs(
  before: StackPublicGraph | null,
  after: StackPublicGraph,
): StackRuntimeEvent[] {
  if (!before) return []

  const previous = nodeMap(before)
  const current = nodeMap(after)
  const at = after.generatedAt
  const events: StackRuntimeEvent[] = []

  for (const node of after.nodes) {
    const old = previous.get(node.id)
    if (!old) {
      events.push({
        id:randomUUID(),
        at,
        kind:'node.added',
        nodeId:node.id,
        label:node.label,
        to:node.state,
        node,
        edges:after.edges.filter(edge => edge.source === node.id || edge.target === node.id),
      })
      continue
    }
    if (old.state !== node.state) {
      events.push({
        id:randomUUID(),
        at,
        kind:'node.state',
        nodeId:node.id,
        label:node.label,
        from:old.state,
        to:node.state,
      })
    }
  }

  for (const node of before.nodes) {
    if (current.has(node.id)) continue
    events.push({
      id:randomUUID(),
      at,
      kind:'node.removed',
      nodeId:node.id,
      label:node.label,
      from:node.state,
      node,
      edges:before.edges.filter(edge => edge.source === node.id || edge.target === node.id),
    })
  }

  return events
}

async function readPrevious(redis: Awaited<ReturnType<typeof ensureRedis>>) {
  const raw = await redis.get(SNAPSHOT_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StackPublicGraph
  } catch {
    return null
  }
}

export async function recordStackRuntime(graph: StackPublicGraph) {
  const redis = await ensureRedis()
  const [previous, recordedStart] = await Promise.all([
    readPrevious(redis),
    redis.get(HISTORY_STARTED_KEY),
  ])
  const freshEvents = diffGraphs(previous, graph)
  const availableFrom = recordedStart ?? previous?.generatedAt ?? graph.generatedAt

  const multi = redis.multi()
  multi.set(
    SNAPSHOT_KEY,
    JSON.stringify({ ...graph, events:[], history:undefined }),
    'EX',
    SNAPSHOT_TTL_SECONDS,
  )
  multi.set(HISTORY_STARTED_KEY, availableFrom, 'EX', SNAPSHOT_TTL_SECONDS)

  for (const event of freshEvents) {
    multi.lpush(EVENTS_KEY, JSON.stringify(event))
  }
  if (freshEvents.length) multi.ltrim(EVENTS_KEY, 0, EVENT_LIMIT - 1)
  multi.expire(EVENTS_KEY, SNAPSHOT_TTL_SECONDS)
  await multi.exec()

  const rawEvents = await redis.lrange(EVENTS_KEY, 0, 24)
  const events = rawEvents.flatMap(raw => {
    try { return [JSON.parse(raw) as StackRuntimeEvent] } catch { return [] }
  })

  return {
    ...graph,
    events,
    history:{ mode:'live' as const, availableFrom, complete:true },
  }
}

export async function getStackRuntimeEvents(limit = 25) {
  const redis = await ensureRedis()
  const rawEvents = await redis.lrange(EVENTS_KEY, 0, Math.max(0, limit - 1))
  return rawEvents.flatMap(raw => {
    try { return [JSON.parse(raw) as StackRuntimeEvent] } catch { return [] }
  })
}

function rebuildSignals(graph: StackPublicGraph, nodes: StackPublicGraph['nodes']) {
  const values: Record<string, string> = {
    docker:String(nodes.filter(node => node.runtime === 'docker' && node.kind !== 'network').length),
    lxd:String(nodes.filter(node => node.runtime === 'lxd').length),
    networks:String(nodes.filter(node => node.kind === 'network').length),
    online:String(nodes.filter(node => node.state === 'online').length),
    degraded:String(nodes.filter(node => node.state === 'degraded').length),
  }
  return graph.signals.map(signal => ({
    ...signal,
    value:values[signal.key] ?? signal.value,
  }))
}

export async function reconstructStackGraphAt(
  currentGraph: StackPublicGraph,
  targetAt: string,
): Promise<StackPublicGraph> {
  const targetMs = Date.parse(targetAt)
  if (!Number.isFinite(targetMs)) return currentGraph

  const redis = await ensureRedis()
  const [events, availableFrom] = await Promise.all([
    getStackRuntimeEvents(EVENT_LIMIT),
    redis.get(HISTORY_STARTED_KEY),
  ])
  const nodes = new Map(currentGraph.nodes.map(node => [node.id, { ...node }]))
  const edges = new Map(currentGraph.edges.map(edge => [edge.id, edge]))
  let complete = !!availableFrom && targetMs >= Date.parse(availableFrom)

  for (const event of events) {
    if (Date.parse(event.at) <= targetMs) continue

    if (event.kind === 'node.added') {
      nodes.delete(event.nodeId)
      for (const [id, edge] of edges) {
        if (edge.source === event.nodeId || edge.target === event.nodeId) edges.delete(id)
      }
      continue
    }

    if (event.kind === 'node.removed') {
      if (!event.node) {
        complete = false
        continue
      }
      nodes.set(event.nodeId, { ...event.node })
      for (const edge of event.edges ?? []) edges.set(edge.id, edge)
      continue
    }

    const node = nodes.get(event.nodeId)
    if (!node || !event.from) {
      complete = false
      continue
    }
    nodes.set(event.nodeId, { ...node, state:event.from })
  }

  const historicalNodes = [...nodes.values()]
  return {
    ...currentGraph,
    generatedAt:new Date(targetMs).toISOString(),
    nodes:historicalNodes,
    edges:[...edges.values()].filter(edge => nodes.has(edge.source) && nodes.has(edge.target)),
    signals:rebuildSignals(currentGraph, historicalNodes),
    events:events.filter(event => Date.parse(event.at) <= targetMs).slice(0, 25),
    history:{
      mode:'historical',
      targetAt:new Date(targetMs).toISOString(),
      availableFrom:availableFrom ?? undefined,
      complete,
    },
  }
}
