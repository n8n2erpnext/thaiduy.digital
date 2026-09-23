import { NextResponse } from 'next/server'
import { z } from 'zod'
import { publishMusicDspFrame } from '@/brains/music-sensor/live-signal'
import { authenticateHubDevice, MUSIC_SENSOR_SCOPE } from '@/lib/hub-device-auth'

export const dynamic = 'force-dynamic'

const unit = z.number().finite().min(0).max(1)
const frameSchema = z.object({
  deviceId: z.string().min(1).max(80),
  seq: z.number().int().min(0),
  at: z.string().datetime(),
  sampleRate: z.number().int().min(8_000).max(192_000),
  windowMs: z.number().int().min(10).max(1_000),
  rms: unit,
  peak: unit,
  bass: unit,
  lowMid: unit,
  mid: unit,
  presence: unit,
  air: unit,
  spectralFlux: unit,
  spectralCentroid: z.number().finite().min(0).max(48_000).optional(),
  spectralFlatness: unit.optional(),
  zeroCrossingRate: unit.optional(),
  tempoBpm: z.number().finite().min(0).max(300).optional(),
  tempoAutocorrBpm: z.number().finite().min(0).max(300).optional(),
  tempoOnsetBpm: z.number().finite().min(0).max(300).optional(),
  processIntervalMs: z.number().finite().min(0).max(1_000).optional(),
  beatConfidence: unit.optional(),
  meter: z.enum(['2/4','3/4','4/4','6/8','unknown']).optional(),
  meterCorr2: z.number().finite().min(-1).max(1).optional(),
  meterCorr3: z.number().finite().min(-1).max(1).optional(),
  meterCorr4: z.number().finite().min(-1).max(1).optional(),
  meterAccent2: unit.optional(),
  meterAccent3: unit.optional(),
  meterAccent4: unit.optional(),
  swingness: unit.optional(),
  percussiveProbability: unit.optional(),
  harmonicProbability: unit.optional(),
  dynamicRange: unit.optional(),
  vocalProbability: unit.optional(),
})

export async function POST(request: Request) {
  const device = await authenticateHubDevice(request.headers.get('authorization'), MUSIC_SENSOR_SCOPE)
  if (!device) return NextResponse.json({ accepted:false }, { status:401 })
  const parsed = frameSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ accepted:false }, { status:400 })
  }
  const age = Math.abs(Date.now() - Date.parse(parsed.data.at))
  if (!Number.isFinite(age) || age > 30_000) {
    return NextResponse.json({ accepted:false }, { status:400 })
  }
  const frame = {
    ...parsed.data,
    deviceId: device.id === 'legacy' ? parsed.data.deviceId : device.id,
  }
  await publishMusicDspFrame(frame)
  return new Response(null, { status:202 })
}
