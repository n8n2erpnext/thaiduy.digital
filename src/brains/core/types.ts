export type BrainConfidence = number
export type HemisphereSide = 'left' | 'right'

export type BrainEvidence<T = unknown> = {
  source: string
  confidence: BrainConfidence
  observedAt: string
  value: T
}

export type HemisphereResult<T = unknown> = {
  side: HemisphereSide
  cycleId: string
  evidence: BrainEvidence<T>[]
  summary: string
}

export type CortexDecision<T = unknown> = {
  cycleId: string
  confidence: BrainConfidence
  decidedAt: string
  state: T
  rationaleTags: string[]
}

export type HemisphereMemory<T = unknown> = {
  learned: T[]
  maxEntries: number
}

export type LunaMemory<L = unknown, R = unknown, C = unknown> = {
  left: HemisphereMemory<L>
  right: HemisphereMemory<R>
  cortex: HemisphereMemory<C>
}
