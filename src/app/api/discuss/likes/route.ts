import { NextRequest,NextResponse } from 'next/server'
import { z } from 'zod'
import { toggleCommunityLike } from '@/community/data'
import { auth } from '@/lib/auth'

const payloadSchema=z.object({
  kind:z.enum(['thread','reply']),
  id:z.uuid(),
})

export async function POST(request:NextRequest) {
  const session=await auth.api.getSession({headers:request.headers})
  if (!session?.user) {
    return NextResponse.json({error:'auth_required'},{status:401})
  }

  const raw=await request.json().catch(()=>null)
  const parsed=payloadSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({error:'invalid_payload'},{status:400})
  }

  try {
    const result=await toggleCommunityLike(
      parsed.data.kind,
      parsed.data.id,
      session.user.id,
    )
    return NextResponse.json(result)
  } catch (error) {
    const code=error instanceof Error?error.message:'community_like_failed'
    const status=
      code==='google_required'?403:
      code==='community_blocked'?403:
      code==='community_item_not_found'?404:400
    return NextResponse.json({error:code},{status})
  }
}
