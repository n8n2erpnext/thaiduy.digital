import type { StackNodeState } from '@/lib/stack-graph'

export type OrganismNode = {
  id:string
  label:string
  role:string
  state:StackNodeState | 'offline'
  x:number
  y:number
  importance:number
}

export type OrganismLink = {
  source:string
  target:string
}

export type OrganismEvent = {
  at:string
  source:string
  state:string
  type:'runtime.state' | 'runtime.added' | 'runtime.removed'
}

export type PublicOrganismState = {
  mode:'calm' | 'active' | 'degraded'
  updatedAt:string
  nodes:OrganismNode[]
  links:OrganismLink[]
  events:OrganismEvent[]
}
