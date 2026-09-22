import { NextRequest,NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { submitCommunityReply } from '@/community/data'

type Props={params:Promise<{id:string}>}

export async function POST(request:NextRequest,{params}:Props) {
  const session=await auth.api.getSession({headers:request.headers})
  if (!session?.user) {
    return NextResponse.json({error:'auth_required'},{status:401})
  }

  const {id}=await params
  const raw=await request.json().catch(()=>null)
  const parsed=z.object({
    body:z.string().default(''),
    parentReplyId:z.uuid().nullable().optional(),
  }).safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({error:'invalid_payload'},{status:400})
  }

  try {
    const reply=await submitCommunityReply(
      id,
      session.user.id,
      parsed.data.body,
      parsed.data.parentReplyId,
    )
    return NextResponse.json({reply},{status:201})
  } catch (error) {
    const code=error instanceof Error?error.message:'community_failed'
    const status=
      code==='google_required'?403:
      code==='community_blocked'?403:
      code==='thread_not_found'?404:
      code==='parent_reply_not_found'?404:
      code==='community_rate_limited'?429:400
    return NextResponse.json({error:code},{status})
  }
}
