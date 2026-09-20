import { discoverPrivateStackGraph } from '@/server/stack/discovery'
import {
  clearStackDiscoveryRefreshRequest,
  getStackDiscoveryRefreshRequest,
  writeStackDiscoverySnapshot,
} from '@/server/stack/snapshot'

async function main() {
  const requestedOnly = process.argv.includes('--if-requested')
  if (requestedOnly && !(await getStackDiscoveryRefreshRequest())) return

  const graph = await discoverPrivateStackGraph({ strict:true })
  await writeStackDiscoverySnapshot(graph)
  await clearStackDiscoveryRefreshRequest()

  const docker = graph.nodes.filter(
    node => node.runtime === 'docker' && node.kind !== 'network',
  ).length
  const lxd = graph.nodes.filter(node => node.runtime === 'lxd').length
  console.log(
    `[stack-refresh] ${graph.generatedAt} nodes=${graph.nodes.length} edges=${graph.edges.length} docker=${docker} lxd=${lxd}`,
  )
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('[stack-refresh] failed; previous snapshot preserved')
    console.error(error)
    process.exit(1)
  })
