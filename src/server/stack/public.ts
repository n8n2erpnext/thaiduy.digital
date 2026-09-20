import 'server-only'

import {
  discoverPrivateStackGraph,
  sanitizeStackGraph,
} from '@/server/stack/discovery'
import {
  discoverySnapshotIsStale,
  readPrivateDiscoverySnapshot,
  readPublicDiscoverySnapshot,
  stackDiscoveryMode,
} from '@/server/stack/snapshot'
import { recordStackRuntime } from '@/server/stack/runtime'

function withDiscoveryFreshness<T extends { signals: Array<{ key:string; label:string; value:string }> }>(
  graph: T,
  stale: boolean,
): T {
  return {
    ...graph,
    signals:[
      ...graph.signals.filter(signal => signal.key !== 'discovery'),
      { key:'discovery', label:'Discovery', value:stale ? 'STALE' : 'FRESH' },
    ],
  }
}

async function publicDiscoveryGraph() {
  if (stackDiscoveryMode() === 'direct') {
    return withDiscoveryFreshness(
      sanitizeStackGraph(await discoverPrivateStackGraph()),
      false,
    )
  }

  const snapshot = await readPublicDiscoverySnapshot()
  if (!snapshot) throw new Error('Stack discovery snapshot unavailable')
  return withDiscoveryFreshness(
    snapshot.graph,
    discoverySnapshotIsStale(snapshot.capturedAt),
  )
}

async function privateDiscoveryGraph() {
  if (stackDiscoveryMode() === 'direct') {
    return withDiscoveryFreshness(await discoverPrivateStackGraph(), false)
  }

  const snapshot = await readPrivateDiscoverySnapshot()
  if (!snapshot) throw new Error('Private stack discovery snapshot unavailable')
  return withDiscoveryFreshness(
    snapshot.graph,
    discoverySnapshotIsStale(snapshot.capturedAt),
  )
}

export async function getLivePublicStackGraph() {
  const publicGraph = await publicDiscoveryGraph()
  const live = await recordStackRuntime(publicGraph)
  return { graph:live }
}

export async function getLivePrivateStackGraph() {
  return { graph:await privateDiscoveryGraph() }
}
