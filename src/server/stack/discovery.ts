import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type {
  StackGroupKey,
  StackNodeKind,
  StackNodeState,
  StackPrivateGraph,
  StackPrivateNode,
  StackPublicEdge,
  StackPublicGraph,
} from '@/lib/stack-graph'

const execFileAsync = promisify(execFile)
const DISCOVERY_TIMEOUT_MS = 10_000

type DockerPsRow = {
  ID?: string
  Image?: string
  Labels?: string
  Names?: string
  Networks?: string
  Ports?: string
  State?: string
  Status?: string
  HealthStatus?: string
  RunningFor?: string
}

type DockerInspectRow = {
  Id?: string
  Name?: string
  Config?: {
    Image?: string
    Labels?: Record<string, string>
  }
  NetworkSettings?: {
    Networks?: Record<string, { IPAddress?: string }>
  }
}

type DockerNetworkRow = {
  ID?: string
  Name?: string
  Driver?: string
  Scope?: string
}

type LxcRow = {
  name?: string
  status?: string
  state?: string
  type?: string
  snapshots?: unknown[]
  network?: Record<string, {
    addresses?: Array<{
      address?: string
      family?: string
      scope?: string
    }>
  }>
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function parseLabels(value?: string) {
  const labels = new Map<string, string>()
  if (!value) return labels
  for (const pair of value.split(',')) {
    const index = pair.indexOf('=')
    if (index < 1) continue
    labels.set(pair.slice(0, index), pair.slice(index + 1))
  }
  return labels
}

async function jsonLines<T>(bin: string, args: string[], strict = false) {
  try {
    const { stdout } = await execFileAsync(bin, args, {
      timeout: DISCOVERY_TIMEOUT_MS,
      maxBuffer: 1024 * 1024 * 12,
    })
    return stdout
      .split('\n')
      .filter(Boolean)
      .flatMap(line => {
        try { return [JSON.parse(line) as T] } catch { return [] }
      })
  } catch (error) {
    if (strict) throw error
    return [] as T[]
  }
}

async function json<T>(bin: string, args: string[], strict = false) {
  try {
    const { stdout } = await execFileAsync(bin, args, {
      timeout: DISCOVERY_TIMEOUT_MS,
      maxBuffer: 1024 * 1024 * 20,
    })
    return JSON.parse(stdout) as T
  } catch (error) {
    if (strict) throw error
    return null
  }
}

function classifyKind(name: string, image: string): StackNodeKind {
  const value = `${name} ${image}`.toLowerCase()
  if (/postgres|mysql|mariadb|mongo|redis|valkey|clickhouse/.test(value)) return 'database'
  if (/traefik|nginx|caddy|reverse-proxy|\bproxy\b/.test(value)) return 'proxy'
  if (/netbird|wireguard|tailscale/.test(value)) return 'network'
  if (/r2|storage|minio|s3/.test(value)) return 'storage'
  if (/next|ghost|affine|directus|erpnext|lightbi|light-remote|remote-bridge|dashboard|wall/.test(value)) return 'app'
  return 'service'
}

function classifyGroup(name: string, image: string, kind: StackNodeKind): StackGroupKey {
  const value = `${name} ${image}`.toLowerCase()
  if (/thaiduy|frontend|website|web$/.test(value) && kind === 'app') return 'surface'
  if (/n8n|workflow|automation/.test(value)) return 'automation'
  if (/crowdsec|fail2ban|sentinel|security|wazuh/.test(value)) return 'security'
  if (/beszel|grafana|prometheus|loki|uptime|komodo|monitor/.test(value)) return 'observability'
  if (kind === 'database' || kind === 'storage') return 'data'
  if (kind === 'network' || kind === 'proxy') return 'network'
  if (kind === 'container' || kind === 'host') return 'compute'
  if (kind === 'app') return 'apps'
  return 'other'
}

function stateFromDocker(row: DockerPsRow): StackNodeState {
  const raw = `${row.State ?? ''} ${row.Status ?? ''} ${row.HealthStatus ?? ''}`.toLowerCase()
  if (/unhealthy|restarting|dead/.test(raw)) return 'degraded'
  if (/paused|stopped|exited/.test(raw)) return 'paused'
  if (row.State === 'running' || /\bup\b|running|healthy/.test(raw)) return 'online'
  return 'unknown'
}

function stateFromLxc(row: LxcRow): StackNodeState {
  const value = `${row.status ?? ''} ${row.state ?? ''}`.toLowerCase()
  if (value.includes('running')) return 'online'
  if (/stopped|frozen/.test(value)) return 'paused'
  return 'unknown'
}

function roleForNode(kind: StackNodeKind, group: StackGroupKey) {
  if (group === 'automation') return 'workflow circulation'
  if (group === 'security') return 'security sensing'
  if (group === 'observability') return 'runtime observability'
  if (group === 'data') return kind === 'storage' ? 'object storage' : 'data service'
  if (group === 'network') return kind === 'proxy' ? 'edge routing' : 'private connective tissue'
  if (group === 'surface') return 'public surface'
  if (group === 'apps') return 'application service'
  if (group === 'compute') return 'compute runtime'
  return 'supporting service'
}

function dockerNodeId(name: string) {
  return `docker-${normalize(name)}`
}

function networkNodeId(name: string) {
  return `network-${normalize(name)}`
}

function lxdNodeId(name: string) {
  return `lxd-${normalize(name)}`
}

function addressesFromDocker(inspect?: DockerInspectRow) {
  return Object.values(inspect?.NetworkSettings?.Networks ?? {})
    .flatMap(network => network.IPAddress ? [network.IPAddress] : [])
}

function addressesFromLxc(row: LxcRow) {
  return Object.values(row.network ?? {})
    .flatMap(network => network.addresses ?? [])
    .flatMap(address => {
      if (address.family !== 'inet' || address.scope === 'link' || !address.address) return []
      return [address.address]
    })
}

export async function discoverPrivateStackGraph(
  options: { strict?: boolean } = {},
): Promise<StackPrivateGraph> {
  const strict = options.strict ?? false
  const [dockerRows, networkRows, lxcRows] = await Promise.all([
    jsonLines<DockerPsRow>('docker', ['ps', '--format', '{{json .}}'], strict),
    jsonLines<DockerNetworkRow>('docker', ['network', 'ls', '--format', '{{json .}}'], strict),
    json<LxcRow[]>('lxc', ['list', '--format', 'json'], strict).then(value => value ?? []),
  ])

  const dockerNames = dockerRows.flatMap(row => row.Names ? [row.Names] : [])
  const networkNames = networkRows.flatMap(row => row.Name && row.Name !== 'none' ? [row.Name] : [])

  const dockerInspect = dockerNames.length
    ? await json<DockerInspectRow[]>('docker', ['inspect', ...dockerNames], strict).then(value => value ?? [])
    : []

  const nodes: StackPrivateNode[] = []
  const edges: StackPublicEdge[] = []

  nodes.push({
    id: 'host-arm-main',
    label: 'ARM MAIN',
    kind: 'host',
    state: 'online',
    group: 'compute',
    role: 'primary runtime host',
    runtime: 'host',
    ageLabel: 'live',
  })

  for (const network of networkRows) {
    const name = network.Name
    if (!name || name === 'none') continue
    const id = networkNodeId(name)
    nodes.push({
      id,
      label: name,
      kind: 'network',
      state: 'private',
      group: 'network',
      role: 'docker network',
      runtime: 'docker',
      rawStatus: [network.Driver, network.Scope].filter(Boolean).join(' / '),
    })
    edges.push({
      id: `host-${id}`,
      source: 'host-arm-main',
      target: id,
      relation: 'hosts',
      protocol: 'control',
    })
  }

  for (const row of dockerRows) {
    const name = row.Names ?? row.ID ?? 'docker-service'
    const inspect = dockerInspect.find(item => item.Name === `/${name}` || item.Name === name)
    const labels = parseLabels(row.Labels)
    const image = row.Image ?? inspect?.Config?.Image ?? ''
    const kind = classifyKind(name, image)
    const group = classifyGroup(name, image, kind)
    const id = dockerNodeId(name)
    const project = labels.get('com.docker.compose.project')
    const service = labels.get('com.docker.compose.service')
    const networks = (row.Networks ?? '').split(',').map(item => item.trim()).filter(Boolean)

    nodes.push({
      id,
      label: name,
      kind,
      state: stateFromDocker(row),
      group,
      role: roleForNode(kind, group),
      runtime: 'docker',
      project,
      service,
      health: row.HealthStatus && row.HealthStatus !== 'none' ? row.HealthStatus : undefined,
      ageLabel: row.RunningFor,
      containerId: row.ID ?? inspect?.Id,
      image,
      ports: row.Ports,
      networks,
      addresses: addressesFromDocker(inspect),
      composeProject: project,
      composeService: service,
      rawStatus: row.Status,
    })

    edges.push({
      id: `host-${id}`,
      source: 'host-arm-main',
      target: id,
      relation: 'hosts',
      protocol: kind === 'database'
        ? 'database'
        : kind === 'storage'
          ? 'storage'
          : kind === 'proxy' || kind === 'app'
            ? 'http'
            : 'private',
    })

    for (const networkName of networks) {
      if (networkName === 'none') continue
      const source = networkNodeId(networkName)
      if (!networkNames.includes(networkName)) continue
      edges.push({
        id: `${source}-${id}`,
        source,
        target: id,
        relation: 'member',
        protocol: 'private',
      })
    }
  }

  for (const row of lxcRows) {
    const name = row.name ?? 'lxd'
    const id = lxdNodeId(name)
    nodes.push({
      id,
      label: name,
      kind: 'container',
      state: stateFromLxc(row),
      group: 'compute',
      role: 'isolated compute node',
      runtime: 'lxd',
      addresses: addressesFromLxc(row),
      rawStatus: row.status ?? row.state,
    })
    edges.push({
      id: `host-${id}`,
      source: 'host-arm-main',
      target: id,
      relation: 'hosts',
      protocol: 'private',
    })
  }

  const generatedAt = new Date().toISOString()
  const online = nodes.filter(node => node.state === 'online').length
  const degraded = nodes.filter(node => node.state === 'degraded').length

  return {
    generatedAt,
    nodes,
    edges,
    events: [],
    signals: [
      { key:'docker', label:'Docker', value:String(dockerRows.length) },
      { key:'lxd', label:'LXD', value:String(lxcRows.length) },
      { key:'networks', label:'Networks', value:String(networkNames.length) },
      { key:'online', label:'Online', value:String(online) },
      { key:'degraded', label:'Degraded', value:String(degraded) },
    ],
  }
}

export function sanitizeStackGraph(graph: StackPrivateGraph): StackPublicGraph {
  return {
    generatedAt: graph.generatedAt,
    nodes: graph.nodes.map(node => ({
      id:node.id,
      label:node.label,
      kind:node.kind,
      state:node.state,
      group:node.group,
      role:node.role,
      runtime:node.runtime,
      project:node.project,
      service:node.service,
      health:node.health,
      ageLabel:node.ageLabel,
    })),
    edges:graph.edges,
    signals:graph.signals,
    events:graph.events,
  }
}

export async function discoverPublicStackGraph() {
  return sanitizeStackGraph(await discoverPrivateStackGraph())
}
