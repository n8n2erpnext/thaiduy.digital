import { NextResponse } from 'next/server'
import { resolveLocale } from '@/i18n/locale'
import { isFeatureEnabled } from '@/lib/feature-flags'
import { getPublicOrganismState } from '@/server/stack/organism'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await isFeatureEnabled('public.runtime_state', true))) {
    return NextResponse.json(
      { mode:'calm', updatedAt:new Date().toISOString(), nodes:[], links:[], events:[] },
      { headers:{ 'Cache-Control':'no-store, max-age=0' } },
    )
  }

  const locale = await resolveLocale()
  const state = await getPublicOrganismState(locale)
  return NextResponse.json(state, {
    headers:{ 'Cache-Control':'no-store, max-age=0' },
  })
}
