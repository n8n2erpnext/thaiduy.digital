export type StackNodeKind =
  | 'host'
  | 'network'
  | 'proxy'
  | 'app'
  | 'service'
  | 'database'
  | 'storage'
  | 'container'
  | 'external'

export type StackNodeState = 'online' | 'degraded' | 'paused' | 'private' | 'unknown'

export type StackGroupKey =
  | 'surface'
  | 'apps'
  | 'automation'
  | 'data'
  | 'network'
  | 'security'
  | 'observability'
  | 'compute'
  | 'other'

export type StackPublicNode = {
  id: string
  label: string
  kind: StackNodeKind
  state: StackNodeState
  group: StackGroupKey
  role: string
  runtime: 'docker' | 'lxd' | 'host'
  project?: string
  service?: string
  health?: string
  ageLabel?: string
}

export type StackPublicEdge = {
  id: string
  source: string
  target: string
  relation: 'hosts' | 'member' | 'depends' | 'routes' | 'control'
  protocol: 'private' | 'http' | 'database' | 'control' | 'storage'
}

export type StackSignal = {
  key: string
  label: string
  value: string
}

export type StackRuntimeEvent = {
  id: string
  at: string
  kind: 'node.added' | 'node.removed' | 'node.state'
  nodeId: string
  label: string
  from?: StackNodeState
  to?: StackNodeState
  node?: StackPublicNode
  edges?: StackPublicEdge[]
}

export type StackHistoryState = {
  mode: 'live' | 'historical'
  targetAt?: string
  availableFrom?: string
  complete?: boolean
}

export type StackPublicGraph = {
  generatedAt: string
  nodes: StackPublicNode[]
  edges: StackPublicEdge[]
  signals: StackSignal[]
  events: StackRuntimeEvent[]
  history?: StackHistoryState
}

export type StackPrivateNode = StackPublicNode & {
  containerId?: string
  image?: string
  ports?: string
  networks?: string[]
  addresses?: string[]
  composeProject?: string
  composeService?: string
  rawStatus?: string
}

export type StackPrivateGraph = Omit<StackPublicGraph, 'nodes'> & {
  nodes: StackPrivateNode[]
}
