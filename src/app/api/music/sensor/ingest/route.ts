import { NextResponse } from 'next/server'
import { z } from 'zod'
import { publishMusicDspFrame } from '@/brains/music-sensor/live-signal'
import { authenticateMusicSensor } from '@/lib/music-sensor-auth'

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
  vocalProbability: unit.optional(),
})

export async function POST(request: Request) {
  const device = await authenticateMusicSensor(request.headers.get('authorization'))
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
