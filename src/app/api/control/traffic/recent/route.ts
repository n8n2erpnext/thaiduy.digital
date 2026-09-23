import { NextRequest, NextResponse } from 'next/server'
import { getControlIdentityFromHeaders } from '@/lib/control-auth'
import { getCvTrafficDetail, getTrafficEventDetail } from '@/control/queries'

function originAllowed(request: NextRequest) {
  const origin=request.headers.get('origin')
  if (!origin) return true
  return origin==='https://thaiduy.digital' || origin==='http://localhost:3000'
}

async function owner(request: NextRequest) {
  if (!originAllowed(request)) return null
  const identity=await getControlIdentityFromHeaders(request.headers)
  return identity.state==='owner' ? identity.session : null
}

export async function GET(request: NextRequest) {
  if (!await owner(request)) return NextResponse.json({error:'unauthorized'},{status:401})

  const url=new URL(request.url)
  const scope=url.searchParams.get('scope')==='cv'?'cv':'overview'
  const limit=Number(url.searchParams.get('limit') ?? 10)
  const page=Number(url.searchParams.get('page') ?? 1)

  const detail=scope==='cv'
    ? await getCvTrafficDetail(24*7,limit,page)
    : await getTrafficEventDetail(24,limit,page)

  return NextResponse.json({
    scope,
    limit:detail.limit,
    page:detail.page,
    pages:detail.pages,
    total:detail.total,
    recent:detail.recent.map(row=>({
      ...row,
      created_at:String(row.created_at),
    })),
  })
}
