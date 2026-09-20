import { NextResponse } from 'next/server'
import { isFeatureEnabled } from '@/lib/feature-flags'
import { getLivePublicStackGraph } from '@/server/stack/public'
import { reconstructStackGraphAt } from '@/server/stack/runtime'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!(await isFeatureEnabled('public.topology', true))) {
    return NextResponse.json(
      { generatedAt:new Date().toISOString(), nodes:[], edges:[], signals:[], events:[] },
      { headers:{ 'Cache-Control':'no-store, max-age=0' } },
    )
  }

  const { graph } = await getLivePublicStackGraph()
  const rawAt = new URL(request.url).searchParams.get('at')
  const parsedAt = rawAt ? Date.parse(rawAt) : Number.NaN
  const now = Date.now()
  const earliest = now - 24 * 60 * 60 * 1000
  const responseGraph = Number.isFinite(parsedAt)
    ? await reconstructStackGraphAt(
        graph,
        new Date(Math.max(earliest, Math.min(now, parsedAt))).toISOString(),
      )
    : graph

  return NextResponse.json(responseGraph, {
    headers:{ 'Cache-Control':'no-store, max-age=0' },
  })
}
