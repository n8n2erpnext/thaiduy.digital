import { NextRequest, NextResponse } from 'next/server'
import { getControlIdentityFromHeaders } from '@/lib/control-auth'
import { getAuditLogPage } from '@/control/queries'

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
  const limit=Number(url.searchParams.get('limit') ?? 10)
  const page=Number(url.searchParams.get('page') ?? 1)
  const result=await getAuditLogPage(limit,page)

  return NextResponse.json({
    limit:result.limit,
    page:result.page,
    pages:result.pages,
    total:result.total,
    rows:result.rows.map(row=>({
      id:row.id,
      actorId:row.actorId,
      action:row.action,
      entityType:row.entityType,
      entityId:row.entityId,
      createdAt:row.createdAt.toISOString(),
    })),
  })
}
