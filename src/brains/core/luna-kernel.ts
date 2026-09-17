import type { CortexDecision, HemisphereResult, LunaMemory } from './types'

export type LunaHemisphere<I, O> = {
  observe(input: I, cycleId: string): Promise<HemisphereResult<O>>
}

export type LunaCortex<L, R, D> = {
  decide(left: HemisphereResult<L>, right: HemisphereResult<R>, cycleId: string): Promise<CortexDecision<D>>
}

export type LunaKernel<I, L, R, D> = {
  left: LunaHemisphere<I, L>
  right: LunaHemisphere<I, R>
  cortex: LunaCortex<L, R, D>
  memory: LunaMemory<L, R, D>
}

export async function runLunaCycle<I, L, R, D>(kernel: LunaKernel<I, L, R, D>, input: I) {
  const cycleId = crypto.randomUUID()
  const [left, right] = await Promise.all([
    kernel.left.observe(input, cycleId),
    kernel.right.observe(input, cycleId),
  ])
  const decision = await kernel.cortex.decide(left, right, cycleId)
  return { cycleId, left, right, decision }
}
