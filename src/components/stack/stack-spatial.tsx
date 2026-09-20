'use client'

import { useEffect, useMemo, useState } from 'react'
import type {
  StackGroupKey,
  StackPublicEdge,
  StackPublicGraph,
  StackPublicNode,
} from '@/lib/stack-graph'
import type { Locale } from '@/i18n/config'

type Props = {
  initialGraph: StackPublicGraph
  locale: Locale
}

type GroupMeta = {
  key: StackGroupKey
  label: string
  x: number
  y: number
  width: number
  height: number
}

type Point = { x:number; y:number }
type PortSide = 'left' | 'right' | 'top' | 'bottom'
type ExternalPort = {
  key: StackGroupKey
  label: string
  count: number
  protocol: StackPublicEdge['protocol']
  side: PortSide
  point: Point
  connections: Array<{
    nodeId: string
    count: number
    protocol: StackPublicEdge['protocol']
  }>
}

const OBJECT_W = 160
const OBJECT_H = 56
const GROUPS: GroupMeta[] = [
  { key:'network', label:'NETWORK', x:70, y:90, width:310, height:190 },
  { key:'security', label:'SECURITY', x:820, y:70, width:260, height:160 },
  { key:'automation', label:'AUTOMATION', x:80, y:360, width:300, height:170 },
  { key:'apps', label:'APPS / PRODUCTS', x:450, y:250, width:360, height:230 },
  { key:'observability', label:'OBSERVABILITY', x:860, y:330, width:290, height:180 },
  { key:'data', label:'DATA', x:420, y:560, width:340, height:190 },
  { key:'compute', label:'COMPUTE', x:790, y:610, width:320, height:170 },
]

const ROOM = { x:76, y:62, width:1048, height:700 }

const ROOM_MARK: Partial<Record<StackGroupKey, string>> = {
  network:'⌁',
  security:'◆',
  automation:'⚙',
  apps:'⬡',
  observability:'▥',
  data:'≡',
  compute:'▦',
}

const ROOM_SPEC: Partial<Record<StackGroupKey, {
  id:string
  function:string
  note:string
}>> = {
  network:{ id:'R-01', function:'FABRIC / ROUTING / INGRESS', note:'CORE FABRIC → EDGE ACCESS' },
  automation:{ id:'R-02', function:'WORKFLOW / ORCHESTRATION', note:'EVENTS → JOBS → SERVICES' },
  apps:{ id:'R-03', function:'APPLICATION / TRUST DELIVERY', note:'PUBLIC SURFACE → PRODUCT PLANE' },
  security:{ id:'R-04', function:'SECURITY BOUNDARY', note:'INSPECT / FILTER / ENFORCE' },
  observability:{ id:'R-05', function:'TELEMETRY / OPERATIONS', note:'SENSE → COLLECT → OBSERVE' },
  data:{ id:'R-06', function:'PERSISTENCE / CACHE / STORAGE', note:'STATEFUL DATA PLANE' },
  compute:{ id:'R-07', function:'RUNTIME / HOSTING', note:'HOST → CONTAINER → SERVICE' },
}
function groupForNode(graph: StackPublicGraph, id: string) {
  return graph.nodes.find(node => node.id === id)?.group
}

function groupEdges(graph: StackPublicGraph) {
  const counts = new Map<string, {
    a:StackGroupKey
    b:StackGroupKey
    count:number
    protocols:Map<StackPublicEdge['protocol'], number>
    directions:Map<string, { source:StackGroupKey; target:StackGroupKey; count:number }>
  }>()

  for (const edge of graph.edges) {
    const source = groupForNode(graph, edge.source)
    const target = groupForNode(graph, edge.target)
    if (!source || !target || source === target) continue
    const [left, right] = [source, target].sort() as [StackGroupKey, StackGroupKey]
    const key = `${left}::${right}`
    const directionKey = `${source}->${target}`
    const current = counts.get(key)

    if (current) {
      current.count += 1
      current.protocols.set(edge.protocol, (current.protocols.get(edge.protocol) ?? 0) + 1)
      const direction = current.directions.get(directionKey)
      if (direction) direction.count += 1
      else current.directions.set(directionKey, { source, target, count:1 })
    } else {
      counts.set(key, {
        a:left,
        b:right,
        count:1,
        protocols:new Map([[edge.protocol, 1]]),
        directions:new Map([[directionKey, { source, target, count:1 }]]),
      })
    }
  }

  return [...counts.values()].map(item => {
    const directions = [...item.directions.values()].sort((a, b) => b.count - a.count)
    const dominant = directions[0]
    return {
      a:item.a,
      b:item.b,
      source:dominant?.source ?? item.a,
      target:dominant?.target ?? item.b,
      bidirectional:directions.length > 1,
      count:item.count,
      protocol:[...item.protocols.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'private',
    }
  })
}

function wireLoad(count: number) {
  if (count >= 9) return 'heavy'
  if (count >= 4) return 'medium'
  return 'light'
}

type HouseWire = ReturnType<typeof groupEdges>[number]
type HoverWire = {
  wire: HouseWire
  x: number
  y: number
}

function protocolSummary(edges: StackPublicEdge[]) {
  const counts = new Map<string, number>()
  for (const edge of edges) counts.set(edge.protocol, (counts.get(edge.protocol) ?? 0) + 1)
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => `${name.toUpperCase()} ${count}`)
    .join(' · ')
}

function districtCenter(meta: GroupMeta) {
  return { x:meta.x + meta.width / 2, y:meta.y + meta.height / 2 }
}

function roomConnectorToward(meta: GroupMeta, target: Point, stubLength = 18) {
  const center = districtCenter(meta)
  const dx = target.x - center.x
  const dy = target.y - center.y
  if (!dx && !dy) {
    return {
      point:center,
      stub:{ x:center.x + stubLength, y:center.y },
      side:'right' as PortSide,
    }
  }

  const halfW = meta.width / 2
  const halfH = meta.height / 2
  const scaleX = dx ? halfW / Math.abs(dx) : Number.POSITIVE_INFINITY
  const scaleY = dy ? halfH / Math.abs(dy) : Number.POSITIVE_INFINITY
  const hitsVerticalSide = scaleX <= scaleY
  const scale = Math.min(scaleX, scaleY)
  const point = {
    x:center.x + dx * scale,
    y:center.y + dy * scale,
  }

  const side: PortSide = hitsVerticalSide
    ? dx >= 0 ? 'right' : 'left'
    : dy >= 0 ? 'bottom' : 'top'

  const stub = side === 'right'
    ? { x:point.x + stubLength, y:point.y }
    : side === 'left'
      ? { x:point.x - stubLength, y:point.y }
      : side === 'bottom'
        ? { x:point.x, y:point.y + stubLength }
        : { x:point.x, y:point.y - stubLength }

  return { point, stub, side }
}

function edgePath(source: GroupMeta, target: GroupMeta) {
  const sourceCenter = districtCenter(source)
  const targetCenter = districtCenter(target)
  const a = roomConnectorToward(source, targetCenter)
  const b = roomConnectorToward(target, sourceCenter)

  if (
    (a.side === 'left' || a.side === 'right') &&
    (b.side === 'left' || b.side === 'right')
  ) {
    const midX = (a.stub.x + b.stub.x) / 2
    return `M ${a.point.x} ${a.point.y} H ${a.stub.x} H ${midX} V ${b.stub.y} H ${b.stub.x} H ${b.point.x}`
  }

  if (
    (a.side === 'top' || a.side === 'bottom') &&
    (b.side === 'top' || b.side === 'bottom')
  ) {
    const midY = (a.stub.y + b.stub.y) / 2
    return `M ${a.point.x} ${a.point.y} V ${a.stub.y} V ${midY} H ${b.stub.x} V ${b.stub.y} V ${b.point.y}`
  }

  if (a.side === 'left' || a.side === 'right') {
    return `M ${a.point.x} ${a.point.y} H ${a.stub.x} V ${b.stub.y} H ${b.stub.x} V ${b.point.y}`
  }

  return `M ${a.point.x} ${a.point.y} V ${a.stub.y} H ${b.stub.x} V ${b.stub.y} H ${b.point.x}`
}

function roomEdgePath(a: Point, b: Point) {
  const aCenter = { x:a.x + OBJECT_W / 2, y:a.y + OBJECT_H / 2 }
  const bCenter = { x:b.x + OBJECT_W / 2, y:b.y + OBJECT_H / 2 }

  if (Math.abs(aCenter.y - bCenter.y) < OBJECT_H) {
    if (aCenter.x <= bCenter.x) {
      return `M ${a.x + OBJECT_W} ${aCenter.y} H ${b.x}`
    }
    return `M ${a.x} ${aCenter.y} H ${b.x + OBJECT_W}`
  }

  const downward = aCenter.y < bCenter.y
  const startY = downward ? a.y + OBJECT_H : a.y
  const endY = downward ? b.y : b.y + OBJECT_H
  const midY = (startY + endY) / 2
  return `M ${aCenter.x} ${startY} V ${midY} H ${bCenter.x} V ${endY}`
}

function textFit(value: string, max = 24) {
  return value.length <= max ? value : `${value.slice(0, Math.max(1, max - 1))}…`
}
function roomSortWeight(room: StackGroupKey, node: StackPublicNode) {
  if (room === 'network') {
    if (node.kind === 'network') return 0
    if (node.kind === 'host') return 1
    if (node.kind === 'proxy') return 2
    return 3
  }
  if (room === 'data') {
    if (node.kind === 'database') return 0
    if (node.kind === 'storage') return 1
    return 2
  }
  if (room === 'apps') return node.kind === 'app' ? 0 : 1
  if (room === 'automation') return node.kind === 'app' || node.kind === 'service' ? 0 : 1
  if (room === 'compute') return node.kind === 'host' ? 2 : 0
  return node.kind === 'database' ? 0 : node.kind === 'service' ? 1 : 2
}

function roomColumns(room: StackGroupKey, count: number) {
  if (room === 'security') return 1
  if (room === 'automation') return Math.min(2, count)
  if (room === 'observability') return Math.min(2, count)
  if (room === 'data') return Math.min(3, count)
  if (room === 'apps') return Math.min(4, count)
  if (room === 'network') return Math.min(5, count)
  if (room === 'compute') return Math.min(3, count)
  return Math.min(4, count)
}

function objectPositions(nodes: StackPublicNode[], room: StackGroupKey) {
  const positions = new Map<string, Point>()
  const sorted = nodes.slice().sort((a, b) =>
    roomSortWeight(room, a) - roomSortWeight(room, b) ||
    a.kind.localeCompare(b.kind) ||
    a.label.localeCompare(b.label),
  )
  if (!sorted.length) return positions

  if (room === 'compute') {
    const hosts = sorted.filter(node => node.kind === 'host')
    const satellites = sorted.filter(node => node.kind !== 'host')
    const topY = ROOM.y + 190
    const stepX = 230
    const rowWidth = Math.max(0, (satellites.length - 1) * stepX)
    const startX = ROOM.x + ROOM.width / 2 - rowWidth / 2 - OBJECT_W / 2
    satellites.forEach((node, index) => positions.set(node.id, {
      x:startX + index * stepX,
      y:topY,
    }))
    hosts.forEach((node, index) => positions.set(node.id, {
      x:ROOM.x + ROOM.width / 2 - OBJECT_W / 2 + index * (OBJECT_W + 24),
      y:ROOM.y + ROOM.height - 180,
    }))
    return positions
  }

  const columns = roomColumns(room, sorted.length)
  const rows = Math.ceil(sorted.length / columns)
  const gapX = room === 'network' ? 26 : 42
  const gapY = room === 'network' ? 76 : 98
  const totalHeight = rows * OBJECT_H + Math.max(0, rows - 1) * gapY
  const startY = ROOM.y + 142 + Math.max(0, (ROOM.height - 220 - totalHeight) / 2)

  sorted.forEach((node, index) => {
    const row = Math.floor(index / columns)
    const col = index % columns
    const rowCount = Math.min(columns, sorted.length - row * columns)
    const rowWidth = rowCount * OBJECT_W + Math.max(0, rowCount - 1) * gapX
    const rowStartX = ROOM.x + (ROOM.width - rowWidth) / 2
    positions.set(node.id, {
      x:rowStartX + col * (OBJECT_W + gapX),
      y:startY + row * (OBJECT_H + gapY),
    })
  })
  return positions
}

function portSideFor(room: StackGroupKey, other: StackGroupKey): PortSide {
  const current = GROUPS.find(group => group.key === room)
  const target = GROUPS.find(group => group.key === other)
  if (!current || !target) return 'right'
  const a = districtCenter(current)
  const b = districtCenter(target)
  const dx = b.x - a.x
  const dy = b.y - a.y
  if (Math.abs(dx) > Math.abs(dy)) return dx >= 0 ? 'right' : 'left'
  return dy >= 0 ? 'bottom' : 'top'
}

function roomExternalPorts(graph: StackPublicGraph, room: StackGroupKey): ExternalPort[] {
  const groups = new Map<StackGroupKey, Map<string, { count:number; protocols:Map<StackPublicEdge['protocol'], number> }>>()

  for (const edge of graph.edges) {
    const sourceGroup = groupForNode(graph, edge.source)
    const targetGroup = groupForNode(graph, edge.target)
    if (!sourceGroup || !targetGroup || sourceGroup === targetGroup) continue

    let other: StackGroupKey | null = null
    let internalNodeId: string | null = null
    if (sourceGroup === room) {
      other = targetGroup
      internalNodeId = edge.source
    } else if (targetGroup === room) {
      other = sourceGroup
      internalNodeId = edge.target
    }
    if (!other || !internalNodeId) continue

    const byNode = groups.get(other) ?? new Map()
    const relation = byNode.get(internalNodeId) ?? { count:0, protocols:new Map() }
    relation.count += 1
    relation.protocols.set(edge.protocol, (relation.protocols.get(edge.protocol) ?? 0) + 1)
    byNode.set(internalNodeId, relation)
    groups.set(other, byNode)
  }

  const raw = [...groups.entries()].map(([key, byNode]) => {
    const protocolCounts = new Map<StackPublicEdge['protocol'], number>()
    for (const relation of byNode.values()) {
      for (const [protocol, count] of relation.protocols) {
        protocolCounts.set(protocol, (protocolCounts.get(protocol) ?? 0) + count)
      }
    }
    return {
      key,
      label:GROUPS.find(group => group.key === key)?.label ?? key.toUpperCase(),
      side:portSideFor(room, key),
      count:[...byNode.values()].reduce((sum, item) => sum + item.count, 0),
      protocol:[...protocolCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'private',
      connections:[...byNode.entries()].map(([nodeId, relation]) => ({
        nodeId,
        count:relation.count,
        protocol:[...relation.protocols.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'private',
      })),
    }
  })

  const result: ExternalPort[] = []
  for (const side of ['left','right','top','bottom'] as PortSide[]) {
    const items = raw.filter(item => item.side === side).sort((a, b) => b.count - a.count)
    items.forEach((item, index) => {
      const ratio = (index + 1) / (items.length + 1)
      const point = side === 'left'
        ? { x:ROOM.x, y:ROOM.y + 120 + ratio * (ROOM.height - 210) }
        : side === 'right'
          ? { x:ROOM.x + ROOM.width, y:ROOM.y + 120 + ratio * (ROOM.height - 210) }
          : side === 'top'
            ? { x:ROOM.x + 150 + ratio * (ROOM.width - 300), y:ROOM.y + 62 }
            : { x:ROOM.x + 150 + ratio * (ROOM.width - 300), y:ROOM.y + ROOM.height }
      result.push({ ...item, point })
    })
  }
  return result
}

function externalBranchPath(from: Point, port: ExternalPort) {
  if (port.side === 'right') {
    return `M ${from.x + OBJECT_W} ${from.y + OBJECT_H / 2} H ${port.point.x - 54}`
  }
  if (port.side === 'left') {
    return `M ${from.x} ${from.y + OBJECT_H / 2} H ${port.point.x + 54}`
  }
  if (port.side === 'top') {
    return `M ${from.x + OBJECT_W / 2} ${from.y} V ${port.point.y + 46}`
  }
  return `M ${from.x + OBJECT_W / 2} ${from.y + OBJECT_H} V ${port.point.y - 46}`
}

function externalBusPath(port: ExternalPort, nodePoints: Point[]) {
  if (!nodePoints.length) return ''
  if (port.side === 'right' || port.side === 'left') {
    const busX = port.side === 'right' ? port.point.x - 54 : port.point.x + 54
    const ys = nodePoints.map(point => point.y + OBJECT_H / 2)
    const minY = Math.min(port.point.y, ...ys)
    const maxY = Math.max(port.point.y, ...ys)
    return `M ${busX} ${minY} V ${maxY} M ${busX} ${port.point.y} H ${port.point.x}`
  }
  const busY = port.side === 'top' ? port.point.y + 46 : port.point.y - 46
  const xs = nodePoints.map(point => point.x + OBJECT_W / 2)
  const minX = Math.min(port.point.x, ...xs)
  const maxX = Math.max(port.point.x, ...xs)
  return `M ${minX} ${busY} H ${maxX} M ${port.point.x} ${busY} V ${port.point.y}`
}

export function StackSpatial({ initialGraph, locale }: Props) {
  const [graph, setGraph] = useState(initialGraph)
  const [activeRoom, setActiveRoom] = useState<StackGroupKey | null>(null)
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)
  const [hoverWire, setHoverWire] = useState<HoverWire | null>(null)

  useEffect(() => {
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch('/api/stack/live', { cache:'no-store' })
        if (!response.ok) return
        const next = await response.json() as StackPublicGraph
        setGraph(next)
        setActiveNodeId(current =>
          current && next.nodes.some(node => node.id === current) ? current : null,
        )
        setActiveRoom(current =>
          current && next.nodes.some(node => node.group === current) ? current : null,
        )
      } catch {
      }
    }, 12_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (activeNodeId) {
        setActiveNodeId(null)
        return
      }
      if (activeRoom) setActiveRoom(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeNodeId, activeRoom])

  const activeGroups = useMemo(
    () => GROUPS.filter(group => graph.nodes.some(node => node.group === group.key)),
    [graph.nodes],
  )
  const interGroupEdges = useMemo(() => groupEdges(graph), [graph])
  const roomNodes = useMemo(
    () => activeRoom ? graph.nodes.filter(node => node.group === activeRoom) : [],
    [activeRoom, graph.nodes],
  )
  const roomEdges = useMemo(
    () => activeRoom
      ? graph.edges.filter(edge =>
          roomNodes.some(node => node.id === edge.source) &&
          roomNodes.some(node => node.id === edge.target),
        )
      : [],
    [activeRoom, graph.edges, roomNodes],
  )
  const activeNode = useMemo(
    () => activeNodeId ? graph.nodes.find(node => node.id === activeNodeId) ?? null : null,
    [activeNodeId, graph.nodes],
  )

  const copy = locale === 'vi'
    ? {
        house:'STACK HOUSE',
        room:'ROOM',
        object:'OBJECT',
        live:'LIVE',
        stale:'STALE',
        backRoom:'← PHÒNG',
        backHouse:'← NHÀ',
        inspect:'Chạm vào một node để xem chi tiết.',
        state:'TRẠNG THÁI',
        role:'VAI TRÒ',
        runtime:'RUNTIME',
        project:'PROJECT',
        service:'SERVICE',
      }
    : {
        house:'STACK HOUSE',
        room:'ROOM',
        object:'OBJECT',
        live:'LIVE',
        stale:'STALE',
        backRoom:'← ROOM',
        backHouse:'← HOUSE',
        inspect:'Select an object to inspect.',
        state:'STATE',
        role:'ROLE',
        runtime:'RUNTIME',
        project:'PROJECT',
        service:'SERVICE',
      }

  const stepBack = () => {
    if (activeNodeId) {
      setActiveNodeId(null)
      return
    }
    if (activeRoom) setActiveRoom(null)
  }

  const showWireTooltip = (wire: HouseWire, clientX: number, clientY: number) => {
    const width = 278
    const height = 58
    const pad = 14
    let x = clientX + 14
    let y = clientY + 14
    if (x + width > window.innerWidth - pad) x = clientX - width - 14
    if (y + height > window.innerHeight - pad) y = clientY - height - 14
    setHoverWire({
      wire,
      x:Math.max(pad, x),
      y:Math.max(pad, y),
    })
  }

  const discoveryStale = graph.signals.some(
    signal => signal.key === 'discovery' && signal.value === 'STALE',
  )

  const breadcrumb = [
    copy.house,
    activeRoom ? GROUPS.find(group => group.key === activeRoom)?.label : null,
    activeNode ? textFit(activeNode.label, 20) : null,
  ].filter(Boolean).join(' / ')

  return (
    <section
      className="stack-spatial"
      data-level={activeNode ? 'object' : activeRoom ? 'room' : 'house'}
      data-room={activeRoom ?? undefined}
      onPointerDownCapture={event => {
        if (!activeNodeId) return
        const target = event.target as Element
        if (
          target.closest('.stack-spatial-object') ||
          target.closest('.stack-spatial-object-inspector')
        ) return
        setActiveNodeId(null)
      }}
    >
      <header className="stack-spatial-toolbar">
        <div className="stack-atlas-toolbar-left">
          <span className="stack-live stack-atlas-live" data-stale={discoveryStale || undefined}>
            <i />{discoveryStale ? copy.stale : copy.live}
          </span>
          <span className="stack-atlas-toolbar-divider" />
          <span className="stack-atlas-toolbar-title">
            <strong>{breadcrumb}</strong>
            <small>{locale === 'vi' ? 'HỆ THỐNG ĐANG VẬN HÀNH' : 'LIVE SYSTEM ATLAS'}</small>
          </span>
        </div>
        <div className="stack-atlas-toolbar-right">
          {!activeRoom && (
            <span className="stack-meta stack-atlas-counts">
              {graph.nodes.length} NODES · {graph.edges.length} LINKS · {activeGroups.length} ROOMS
            </span>
          )}
          {activeRoom && (
            <button type="button" onClick={stepBack}>
              {activeNode ? copy.backRoom : copy.backHouse}
            </button>
          )}
        </div>
      </header>

      <div className="stack-spatial-stage">
        <svg viewBox="0 0 1200 820" role="img" aria-label="Spatial systems atlas">
          <defs>
            <pattern id="stackSpatialGrid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" className="stack-grid-line" />
            </pattern>
            <marker id="stackSpatialArrow" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 z" fill="context-stroke" />
            </marker>
          </defs>
          <rect width="1200" height="820" fill="url(#stackSpatialGrid)" />

          {!activeRoom ? (
            <HouseScene
              graph={graph}
              groups={activeGroups}
              edges={interGroupEdges}
              onWireHover={(wire, clientX, clientY) => showWireTooltip(wire, clientX, clientY)}
              onWireLeave={() => setHoverWire(null)}
              onEnterRoom={key => {
                setHoverWire(null)
                setActiveRoom(key)
                setActiveNodeId(null)
              }}
            />
          ) : (
            <RoomScene
              graph={graph}
              room={activeRoom}
              nodes={roomNodes}
              edges={roomEdges}
              activeNodeId={activeNodeId}
              onSelectNode={setActiveNodeId}
            />
          )}
        </svg>

        {!activeRoom && <HouseBlueprintOverlay />}

        {!activeRoom && hoverWire && (
          <WireHoverLabel hover={hoverWire} />
        )}

        {activeRoom && (
          <RoomContext
            graph={graph}
            room={activeRoom}
            activeNode={activeNode}
            copy={copy}
            onCloseObject={() => setActiveNodeId(null)}
          />
        )}
      </div>
      {!activeRoom && (
        <footer className="stack-atlas-footer">
          <span className="stack-atlas-footer-brand">
            <i><b /><b /><b /><b /></i>
            <span>
              <strong>Systems Atlas</strong>
              <small>LIVE INFRASTRUCTURE LAB</small>
            </span>
          </span>
          <span className="stack-atlas-footer-meta">
            <small>LIVE SYSTEMS ATLAS</small>
            <b>THÁI DUY</b>
          </span>
        </footer>
      )}
    </section>
  )
}

function HouseBlueprintOverlay() {
  const protocols: Array<{ protocol:StackPublicEdge['protocol']; label:string }> = [
    { protocol:'private', label:'PRIVATE FABRIC' },
    { protocol:'database', label:'DATA BUS' },
    { protocol:'http', label:'HTTP / APP' },
    { protocol:'control', label:'CONTROL' },
    { protocol:'storage', label:'STORAGE' },
  ]

  return (
    <>
      <aside className="stack-spatial-wire-legend">
        <span>WIRING LEGEND / WL-01</span>
        {protocols.map(item => (
          <div key={item.protocol}>
            <i data-protocol={item.protocol} />
            <b>{item.label}</b>
          </div>
        ))}
        <small>LINE WEIGHT = LINK DENSITY · DASH = TRANSPORT SEMANTIC</small>
      </aside>

      <aside className="stack-spatial-room-index-note">
        <span>ROOM INDEX / RI-01</span>
        {GROUPS.map(group => {
          const spec = ROOM_SPEC[group.key]
          if (!spec) return null
          return (
            <div key={group.key}>
              <b>{spec.id}</b>
              <em>{group.label}</em>
            </div>
          )
        })}
      </aside>
    </>
  )
}

function WireHoverLabel({ hover }: { hover:HoverWire }) {
  const source = GROUPS.find(group => group.key === hover.wire.source)?.label ?? hover.wire.source.toUpperCase()
  const target = GROUPS.find(group => group.key === hover.wire.target)?.label ?? hover.wire.target.toUpperCase()
  const direction = hover.wire.bidirectional ? '↔' : '→'
  return (
    <div
      role="tooltip"
      className="stack-wire-tooltip"
      style={{ left:hover.x, top:hover.y }}
    >
      <strong>{source} {direction} {target}</strong>
      <span>
        {hover.wire.protocol.toUpperCase()} · {hover.wire.count} LINKS · {hover.wire.bidirectional ? 'BIDIRECTIONAL' : 'OUTBOUND'}
      </span>
    </div>
  )
}

function HouseScene({
  graph,
  groups,
  edges,
  onWireHover,
  onWireLeave,
  onEnterRoom,
}: {
  graph:StackPublicGraph
  groups:GroupMeta[]
  edges:HouseWire[]
  onWireHover:(wire:HouseWire, clientX:number, clientY:number) => void
  onWireLeave:() => void
  onEnterRoom:(key:StackGroupKey) => void
}) {
  const [hoverRoom,setHoverRoom]=useState<StackGroupKey | null>(null)
  const byGroup = new Map(groups.map(group => [group.key, group]))
  return (
    <g className="stack-spatial-house" data-room-hover={hoverRoom ?? undefined}>
      <g className="stack-spatial-house-wires">
        {edges.map(edge => {
          const source = byGroup.get(edge.source)
          const target = byGroup.get(edge.target)
          if (!source || !target) return null
          const d = edgePath(source, target)
          const sourceConnector=roomConnectorToward(source,districtCenter(target))
          const targetConnector=roomConnectorToward(target,districtCenter(source))
          const relatedToHover=!hoverRoom || edge.source===hoverRoom || edge.target===hoverRoom
          return (
            <g
              key={`${edge.a}-${edge.b}-${edge.protocol}`}
              className="stack-spatial-house-wire"
              data-related={relatedToHover || undefined}
              data-muted={hoverRoom && !relatedToHover || undefined}
              data-protocol={edge.protocol}
              data-load={wireLoad(edge.count)}
            >
              <path
                className="stack-spatial-house-wire-visible"
                d={d}
                data-protocol={edge.protocol}
                data-load={wireLoad(edge.count)}
                markerEnd={edge.bidirectional ? undefined : 'url(#stackSpatialArrow)'}
              />
              <circle
                className="stack-spatial-house-wire-endpoint"
                cx={sourceConnector.point.x}
                cy={sourceConnector.point.y}
                r="4.5"
              />
              <circle
                className="stack-spatial-house-wire-endpoint"
                cx={targetConnector.point.x}
                cy={targetConnector.point.y}
                r="4.5"
              />
              <path
                className="stack-spatial-house-wire-hit"
                d={d}
                onPointerEnter={event => onWireHover(edge, event.clientX, event.clientY)}
                onPointerMove={event => onWireHover(edge, event.clientX, event.clientY)}
                onPointerLeave={onWireLeave}
              />
            </g>
          )
        })}
      </g>

      {groups.map(group => {
        const nodes = graph.nodes.filter(node => node.group === group.key)
        const edgesInside = graph.edges.filter(edge =>
          nodes.some(node => node.id === edge.source || node.id === edge.target),
        )
        const online = nodes.filter(node => node.state === 'online').length
        const spec = ROOM_SPEC[group.key]
        return (
          <g
            key={group.key}
            className="stack-district"
            data-room={group.key}
            onPointerEnter={()=>setHoverRoom(group.key)}
            onPointerLeave={()=>setHoverRoom(null)}
            onFocus={()=>setHoverRoom(group.key)}
            onBlur={()=>setHoverRoom(null)}
            onClick={() => onEnterRoom(group.key)}
            role="button"
            tabIndex={0}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') onEnterRoom(group.key)
            }}
          >
            <rect
              x={group.x}
              y={group.y}
              width={group.width}
              height={group.height}
              rx="18"
              className="stack-atlas-district-shell"
            />
            <rect
              x={group.x}
              y={group.y}
              width={group.width}
              height="42"
              rx="18"
              className="stack-district-head"
            />
            <line
              x1={group.x + 18}
              y1={group.y + 1}
              x2={group.x + group.width - 18}
              y2={group.y + 1}
              className="stack-district-accent"
            />
            <circle
              cx={group.x + 24}
              cy={group.y + 22}
              r="13"
              className="stack-district-badge"
            />
            <text
              x={group.x + 24}
              y={group.y + 26}
              textAnchor="middle"
              className="stack-district-badge-mark"
            >
              {ROOM_MARK[group.key] ?? '•'}
            </text>
            {spec && (
              <text x={group.x + 46} y={group.y + 13} className="stack-spatial-room-index">
                {spec.id}
              </text>
            )}
            <text x={group.x + 46} y={group.y + 31} className="stack-district-title">
              {group.label}
            </text>
            <text
              x={group.x + group.width - 30}
              y={group.y + 26}
              textAnchor="end"
              className="stack-district-count"
            >
              {nodes.length} / {online} LIVE
            </text>
            <circle
              cx={group.x + group.width - 16}
              cy={group.y + 22}
              r="3.8"
              className="stack-district-live"
            />
            <line
              x1={group.x + 16}
              y1={group.y + 52}
              x2={group.x + group.width - 16}
              y2={group.y + 52}
              className="stack-district-rule"
            />
            <text x={group.x + 18} y={group.y + 76} className="stack-district-sub">
              {protocolSummary(edgesInside) || 'NO PUBLIC LINKS'}
            </text>
            <g className="stack-node-chips">
              {nodes.slice(0, 5).map((node, index) => (
                <g
                  key={node.id}
                  className="stack-node-chip"
                  transform={'translate(' + (group.x + 26 + index * 38) + ' ' + (group.y + 112) + ')'}
                >
                  <circle r="13" data-state={node.state} />
                  <text y="3" textAnchor="middle">{textFit(node.label, 1).toUpperCase()}</text>
                </g>
              ))}
              {nodes.length > 5 && (
                <g
                  className="stack-node-chip stack-node-chip-more"
                  transform={'translate(' + (group.x + 26 + 5 * 38) + ' ' + (group.y + 112) + ')'}
                >
                  <circle r="13" />
                  <text y="3" textAnchor="middle">+{nodes.length - 5}</text>
                </g>
              )}
            </g>
            <rect
              x={group.x + 16}
              y={group.y + group.height - 42}
              width={group.width - 32}
              height="28"
              rx="14"
              className="stack-open-plate"
            />
            <text
              x={group.x + 26}
              y={group.y + group.height - 23}
              className="stack-open"
            >
              ENTER ROOM →
            </text>
          </g>
        )
      })}
    </g>
  )
}

function RoomScene({
  graph,
  room,
  nodes,
  edges,
  activeNodeId,
  onSelectNode,
}: {
  graph:StackPublicGraph
  room:StackGroupKey
  nodes:StackPublicNode[]
  edges:StackPublicEdge[]
  activeNodeId:string | null
  onSelectNode:(id:string | null) => void
}) {
  const [hoverNodeId,setHoverNodeId]=useState<string | null>(null)
  const meta = GROUPS.find(group => group.key === room)
  const positions = objectPositions(nodes, room)
  const external = roomExternalPorts(graph, room)
  const focusNodeId=activeNodeId ?? hoverNodeId
  const related = new Set<string>()

  if (focusNodeId) {
    related.add(focusNodeId)
    for (const edge of graph.edges) {
      if (edge.source === focusNodeId) related.add(edge.target)
      if (edge.target === focusNodeId) related.add(edge.source)
    }
  }

  return (
    <g className="stack-spatial-room">
      <g className="stack-spatial-house-memory">
        {GROUPS.filter(group => group.key !== room).map(group => (
          <rect
            key={group.key}
            x={group.x}
            y={group.y}
            width={group.width}
            height={group.height}
            rx="18"
            data-room={group.key}
          />
        ))}
      </g>

      <rect
        x={ROOM.x}
        y={ROOM.y}
        width={ROOM.width}
        height={ROOM.height}
        rx="22"
        className="stack-atlas-room-shell"
      />
      <rect
        x={ROOM.x}
        y={ROOM.y}
        width={ROOM.width}
        height="62"
        rx="22"
        className="stack-spatial-room-head"
      />
      <line
        x1={ROOM.x + 24}
        y1={ROOM.y + 1}
        x2={ROOM.x + ROOM.width - 24}
        y2={ROOM.y + 1}
        className="stack-spatial-room-accent"
      />
      <circle cx={ROOM.x + 31} cy={ROOM.y + 31} r="16" className="stack-spatial-room-badge" />
      <text
        x={ROOM.x + 31}
        y={ROOM.y + 36}
        textAnchor="middle"
        className="stack-spatial-room-badge-mark"
      >
        {ROOM_MARK[room] ?? '•'}
      </text>
      <text x={ROOM.x + 58} y={ROOM.y + 27} className="stack-spatial-room-title">
        {meta?.label ?? room.toUpperCase()}
      </text>
      <text x={ROOM.x + 58} y={ROOM.y + 47} className="stack-spatial-room-sub">
        ROOM / {nodes.length} OBJECTS / {edges.length} INTERNAL LINKS
      </text>

      <g className="stack-spatial-room-links">
        {edges.map(edge => {
          const a = positions.get(edge.source)
          const b = positions.get(edge.target)
          if (!a || !b) return null
          const highlighted = !focusNodeId || edge.source === focusNodeId || edge.target === focusNodeId
          return (
            <path
              key={edge.id}
              d={roomEdgePath(a, b)}
              data-muted={!highlighted || undefined}
              data-protocol={edge.protocol}
            />
          )
        })}
      </g>

      <g className="stack-spatial-external-wires">
        {external.map(port => {
          const nodePoints = port.connections
            .map(connection => positions.get(connection.nodeId))
            .filter((point): point is Point => !!point)
          return (
            <g key={port.key}>
              <path
                className="stack-spatial-external-bus"
                d={externalBusPath(port, nodePoints)}
                data-protocol={port.protocol}
                data-load={wireLoad(port.count)}
                data-muted={!!focusNodeId && !port.connections.some(connection => connection.nodeId === focusNodeId) || undefined}
              />
              {port.connections.map(connection => {
                const point = positions.get(connection.nodeId)
                if (!point) return null
                const highlighted = !focusNodeId || connection.nodeId === focusNodeId
                return (
                  <path
                    key={connection.nodeId}
                    d={externalBranchPath(point, port)}
                    data-muted={!highlighted || undefined}
                    data-protocol={connection.protocol}
                  />
                )
              })}
            </g>
          )
        })}
      </g>

      <g className="stack-spatial-objects">
        {nodes.map(node => {
          const point = positions.get(node.id)
          if (!point) return null
          const dimmed = !!focusNodeId && !related.has(node.id)
          return (
            <g
              key={node.id}
              className="stack-spatial-object"
              data-selected={activeNodeId === node.id || undefined}
              data-hovered={hoverNodeId === node.id || undefined}
              data-dimmed={dimmed || undefined}
              onPointerEnter={()=>setHoverNodeId(node.id)}
              onPointerLeave={()=>setHoverNodeId(null)}
              onFocus={()=>setHoverNodeId(node.id)}
              onBlur={()=>setHoverNodeId(null)}
              onClick={() => onSelectNode(activeNodeId === node.id ? null : node.id)}
              role="button"
              tabIndex={0}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') onSelectNode(node.id)
              }}
            >
              <rect
                x={point.x}
                y={point.y}
                width={OBJECT_W}
                height={OBJECT_H}
                rx="10"
                className="stack-spatial-object-shell"
              />
              <circle
                cx={point.x + 14}
                cy={point.y + 16}
                r="4.5"
                data-state={node.state}
              />
              <text x={point.x + 26} y={point.y + 19} className="stack-spatial-object-title">
                {textFit(node.label, 22)}
              </text>
              <text x={point.x + 14} y={point.y + 39} className="stack-spatial-object-meta">
                {node.kind.toUpperCase()} · {node.runtime.toUpperCase()}
              </text>
              <text x={point.x + 14} y={point.y + 51} className="stack-spatial-object-state">
                {node.state.toUpperCase()}
              </text>
            </g>
          )
        })}
      </g>

      <g className="stack-spatial-ports">
        {external.map(port => {
          const vertical = port.side === 'left' || port.side === 'right'
          const labelX = port.side === 'left'
            ? port.point.x + 18
            : port.side === 'right'
              ? port.point.x - 18
              : port.point.x
          const labelY = port.side === 'top'
            ? port.point.y + 20
            : port.side === 'bottom'
              ? port.point.y - 24
              : port.point.y - 8
          const anchor = port.side === 'left'
            ? 'start'
            : port.side === 'right'
              ? 'end'
              : 'middle'
          const stub = port.side === 'left'
            ? { x2:port.point.x - 18, y2:port.point.y }
            : port.side === 'right'
              ? { x2:port.point.x + 18, y2:port.point.y }
              : port.side === 'top'
                ? { x2:port.point.x, y2:port.point.y - 18 }
                : { x2:port.point.x, y2:port.point.y + 18 }

          return (
            <g key={port.key} data-side={port.side}>
              <line
                x1={port.point.x}
                y1={port.point.y}
                x2={stub.x2}
                y2={stub.y2}
              />
              <circle cx={port.point.x} cy={port.point.y} r="5" />
              <text x={labelX} y={labelY} textAnchor={anchor}>
                {port.label}
              </text>
              <text
                x={labelX}
                y={labelY + (vertical ? 14 : 13)}
                textAnchor={anchor}
                className="stack-spatial-port-count"
              >
                {port.count} LINKS · {port.connections.length} OBJECTS
              </text>
            </g>
          )
        })}
      </g>
    </g>
  )
}

type Copy = {
  inspect:string
  state:string
  role:string
  runtime:string
  project:string
  service:string
}

function RoomContext({
  graph,
  room,
  activeNode,
  copy,
  onCloseObject,
}: {
  graph:StackPublicGraph
  room:StackGroupKey
  activeNode:StackPublicNode | null
  copy:Copy
  onCloseObject:() => void
}) {
  const meta = GROUPS.find(group => group.key === room)
  const spec = ROOM_SPEC[room]
  const nodes = graph.nodes.filter(node => node.group === room)
  const external = roomExternalPorts(graph, room)
  const externalLinks = external.reduce((sum, port) => sum + port.count, 0)
  const objectEdges = activeNode
    ? graph.edges.filter(edge => edge.source === activeNode.id || edge.target === activeNode.id)
    : []
  const objectProtocols = protocolSummary(objectEdges)

  return (
    <>
      <div className="stack-spatial-room-plaque">
        <span>{spec?.id ?? 'ROOM'} / ROOM SPEC</span>
        <strong>{meta?.label ?? room.toUpperCase()}</strong>
        <em>{spec?.function ?? 'LIVE SYSTEM ZONE'}</em>
        <small>{nodes.length} OBJECTS · {external.length} ROOMS · {externalLinks} EXT LINKS</small>
        {spec?.note && <small>{spec.note}</small>}
      </div>

      {activeNode ? (
        <aside className="stack-spatial-object-inspector">
          <button type="button" onClick={onCloseObject}>×</button>
          <span>OBJECT / {activeNode.kind.toUpperCase()}</span>
          <h3>{activeNode.label}</h3>
          <dl>
            <div><dt>{copy.state}</dt><dd>{activeNode.state.toUpperCase()}</dd></div>
            <div><dt>{copy.role}</dt><dd>{activeNode.role}</dd></div>
            <div><dt>{copy.runtime}</dt><dd>{activeNode.runtime.toUpperCase()}</dd></div>
            <div><dt>LINKS</dt><dd>{objectEdges.length}</dd></div>
            <div><dt>PROTO</dt><dd>{objectProtocols || '—'}</dd></div>
            {activeNode.project && <div><dt>{copy.project}</dt><dd>{activeNode.project}</dd></div>}
            {activeNode.service && <div><dt>{copy.service}</dt><dd>{activeNode.service}</dd></div>}
          </dl>
        </aside>
      ) : (
        <div className="stack-spatial-touch-hint">
          <span>OBJECT LAYER</span>
          <p>{copy.inspect}</p>
        </div>
      )}
    </>
  )
}
