import { resolveLocale } from '@/i18n/locale'
import { isFeatureEnabled } from '@/lib/feature-flags'
import { getPublicOrganismState } from '@/server/stack/organism'

export const dynamic = 'force-dynamic'

const encoder = new TextEncoder()

function event(type: string, payload: unknown) {
  return encoder.encode(`event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`)
}

export async function GET(request: Request) {
  if (!(await isFeatureEnabled('public.runtime_state', true))) {
    return new Response(null, {
      status:204,
      headers:{ 'Cache-Control':'no-store' },
    })
  }

  const locale = await resolveLocale()
  let closed = false

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const push = async () => {
        if (closed) return
        try {
          const state = await getPublicOrganismState(locale)
          controller.enqueue(event('organism.state', state))
        } catch {
          controller.enqueue(event('organism.error', {
            at:new Date().toISOString(),
          }))
        }
      }

      await push()
      const timer = setInterval(() => void push(), 15_000)

      request.signal.addEventListener('abort', () => {
        closed = true
        clearInterval(timer)
        try { controller.close() } catch {}
      }, { once:true })
    },
  })

  return new Response(stream, {
    headers:{
      'Cache-Control':'no-cache, no-transform',
      'Content-Type':'text/event-stream',
      Connection:'keep-alive',
      'X-Accel-Buffering':'no',
    },
  })
}
