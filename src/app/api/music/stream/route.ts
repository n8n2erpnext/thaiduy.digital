import { MUSIC_SIGNAL_CHANNEL, getLatestMusicDspFrame } from '@/brains/music-sensor/live-signal'
import {
  MUSIC_PLAYBACK_CHANNEL,
  getLatestHubPlayback,
} from '@/brains/music-sensor/playback-signal'
import { ensureRedis } from '@/lib/redis'
import { isFeatureEnabled } from '@/lib/feature-flags'

export const dynamic = 'force-dynamic'
const encoder = new TextEncoder()

function event(type: string, payload: unknown) {
  return encoder.encode(`event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`)
}

function publicFrame(frame: Record<string, unknown>) {
  const { deviceId: _deviceId, sampleRate: _sampleRate, ...safe } = frame
  void _deviceId
  void _sampleRate
  return safe
}

function publicPlayback(playback: Record<string, unknown>) {
  const { deviceId: _deviceId, ...safe } = playback
  void _deviceId
  return safe
}

export async function GET(request: Request) {
  if (!(await isFeatureEnabled('music.sensor', true))) {
    return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
  }

  let cleanup: (() => void) | null = null
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const base = await ensureRedis()
      const subscriber = base.duplicate()
      if (subscriber.status === 'wait') await subscriber.connect()

      const [latest, playback] = await Promise.all([
        getLatestMusicDspFrame(),
        getLatestHubPlayback(90_000),
      ])
      if (latest) controller.enqueue(event('signal', publicFrame(latest as unknown as Record<string, unknown>)))
      if (playback) controller.enqueue(event('playback', publicPlayback(playback as unknown as Record<string, unknown>)))
      controller.enqueue(event('ready', { at:new Date().toISOString() }))

      const onMessage = (channel: string, payload: string) => {
        try {
          const parsed=JSON.parse(payload) as Record<string, unknown>
          if(channel===MUSIC_PLAYBACK_CHANNEL) {
            controller.enqueue(event('playback', publicPlayback(parsed)))
          } else {
            controller.enqueue(event('signal', publicFrame(parsed)))
          }
        } catch {}
      }
      subscriber.on('message', onMessage)
      await subscriber.subscribe(MUSIC_SIGNAL_CHANNEL, MUSIC_PLAYBACK_CHANNEL)

      const heartbeat = setInterval(() => {
        try { controller.enqueue(event('heartbeat', { at:new Date().toISOString() })) } catch {}
      }, 15_000)

      cleanup = () => {
        clearInterval(heartbeat)
        subscriber.off('message', onMessage)
        void subscriber.unsubscribe(MUSIC_SIGNAL_CHANNEL, MUSIC_PLAYBACK_CHANNEL).finally(() => subscriber.quit())
        try { controller.close() } catch {}
      }
      request.signal.addEventListener('abort', cleanup, { once:true })
    },
    cancel() { cleanup?.() },
  })

  return new Response(stream, { headers:{
    'Cache-Control':'no-cache, no-transform',
    'Content-Type':'text/event-stream',
    Connection:'keep-alive',
    'X-Accel-Buffering':'no',
  } })
}
