import { isFeatureEnabled } from '@/lib/feature-flags'

export const dynamic = 'force-dynamic'

const encoder = new TextEncoder()

function event(type: string, payload: Record<string, unknown>) {
  return encoder.encode(`event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`)
}

export async function GET(request: Request) {
  if (!(await isFeatureEnabled('public.runtime_state', true))) {
    return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const pushHeartbeat = () => {
        controller.enqueue(event('surface.heartbeat', {
          source: 'thaiduy.digital',
          state: 'bootstrap',
          at: new Date().toISOString(),
        }))
      }

      controller.enqueue(event('surface.ready', {
        source: 'thaiduy.digital',
        state: 'connected',
        at: new Date().toISOString(),
      }))
      pushHeartbeat()

      const timer = setInterval(pushHeartbeat, 15_000)
      request.signal.addEventListener('abort', () => {
        clearInterval(timer)
        try { controller.close() } catch {}
      }, { once: true })
    },
  })

  return new Response(stream, {
    headers: {
      'Cache-Control': 'no-cache, no-transform',
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
