import { ensureRedis } from '@/lib/redis'
import type { StackPrivateGraph, StackPublicGraph } from '@/lib/stack-graph'
import { sanitizeStackGraph } from '@/server/stack/discovery'

const PRIVATE_KEY = 'stack:discovery:private:v1'
const PUBLIC_KEY = 'stack:discovery:public:v1'
const HEARTBEAT_KEY = 'stack:discovery:heartbeat:v1'
const REFRESH_REQUEST_KEY = 'stack:discovery:refresh:requested:v1'
const SNAPSHOT_STALE_AFTER_MS = 3 * 60 * 60 * 1000
const REFRESH_REQUEST_TTL_SECONDS = 30 * 60

type DiscoverySnapshot<T> = {
  capturedAt: string
  graph: T
}

function parseSnapshot<T>(raw: string | null): DiscoverySnapshot<T> | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as DiscoverySnapshot<T>
    if (!value?.capturedAt || !value.graph) return null
    return value
  } catch {
    return null
  }
}
export async function writeStackDiscoverySnapshot(graph: StackPrivateGraph) {
  const redis = await ensureRedis()
  const capturedAt = graph.generatedAt
  const privateSnapshot: DiscoverySnapshot<StackPrivateGraph> = { capturedAt, graph }
  const publicSnapshot: DiscoverySnapshot<StackPublicGraph> = {
    capturedAt,
    graph:sanitizeStackGraph(graph),
  }

  const multi = redis.multi()
  multi.set(PRIVATE_KEY, JSON.stringify(privateSnapshot))
  multi.set(PUBLIC_KEY, JSON.stringify(publicSnapshot))
  multi.set(HEARTBEAT_KEY, capturedAt)
  await multi.exec()

  return publicSnapshot.graph
}

export async function readPublicDiscoverySnapshot() {
  const redis = await ensureRedis()
  return parseSnapshot<StackPublicGraph>(await redis.get(PUBLIC_KEY))
}
export async function readPrivateDiscoverySnapshot() {
  const redis = await ensureRedis()
  return parseSnapshot<StackPrivateGraph>(await redis.get(PRIVATE_KEY))
}

export async function getDiscoveryHeartbeat() {
  const redis = await ensureRedis()
  return redis.get(HEARTBEAT_KEY)
}

export async function requestStackDiscoveryRefresh(actorId?: string) {
  const redis = await ensureRedis()
  const requestedAt = new Date().toISOString()
  await redis.set(
    REFRESH_REQUEST_KEY,
    JSON.stringify({ requestedAt, actorId:actorId ?? null }),
    'EX',
    REFRESH_REQUEST_TTL_SECONDS,
  )
  return requestedAt
}

export async function getStackDiscoveryRefreshRequest() {
  const redis = await ensureRedis()
  return redis.get(REFRESH_REQUEST_KEY)
}

export async function clearStackDiscoveryRefreshRequest() {
  const redis = await ensureRedis()
  await redis.del(REFRESH_REQUEST_KEY)
}

export function stackDiscoveryMode() {
  const configured = process.env.STACK_DISCOVERY_MODE?.trim().toLowerCase()
  if (configured === 'direct' || configured === 'snapshot') return configured
  return 'snapshot'
}

export function discoverySnapshotIsStale(capturedAt: string) {
  const capturedMs = Date.parse(capturedAt)
  if (!Number.isFinite(capturedMs)) return true
  return Date.now() - capturedMs > SNAPSHOT_STALE_AFTER_MS
}
