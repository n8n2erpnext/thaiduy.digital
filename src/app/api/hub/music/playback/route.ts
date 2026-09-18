import { NextResponse } from 'next/server'
import { z } from 'zod'
import { publishHubPlayback } from '@/brains/music-sensor/playback-signal'
import { authenticateHubDevice, MUSIC_SENSOR_SCOPE } from '@/lib/hub-device-auth'

export const dynamic = 'force-dynamic'

const playbackSchema = z.object({
  packageName: z.string().trim().min(1).max(180),
  artist: z.string().trim().max(240).default(''),
  title: z.string().trim().min(1).max(320),
  album: z.string().trim().max(320).optional(),
  state: z.enum(['playing', 'paused', 'stopped', 'buffering']),
  positionMs: z.number().int().min(0).max(24 * 60 * 60 * 1000).optional(),
  durationMs: z.number().int().min(0).max(24 * 60 * 60 * 1000).optional(),
  at: z.string().datetime(),
})

export async function POST(request: Request) {
  const device = await authenticateHubDevice(
    request.headers.get('authorization'),
    MUSIC_SENSOR_SCOPE,
  )
  if (!device) return NextResponse.json({ accepted:false }, { status:401 })

  const parsed = playbackSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ accepted:false }, { status:400 })
  }

  const age = Math.abs(Date.now() - Date.parse(parsed.data.at))
  if (!Number.isFinite(age) || age > 60_000) {
    return NextResponse.json({ accepted:false }, { status:400 })
  }

  await publishHubPlayback({
    deviceId:device.id,
    ...parsed.data,
  })
  return new Response(null, { status:202 })
}
