import { NextRequest,NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { submitCommunityThread } from '@/community/data'

export async function POST(request:NextRequest) {
  const session=await auth.api.getSession({headers:request.headers})
  if (!session?.user) {
    return NextResponse.json({error:'auth_required'},{status:401})
  }

  const payload=await request.json().catch(()=>null) as {
    title?:string
    body?:string
    locale?:string
  } | null

  try {
    const locale=payload?.locale==='vi'?'vi':'en'
    const thread=await submitCommunityThread(
      session.user.id,
      payload?.title ?? '',
      payload?.body ?? '',
      locale,
    )
    return NextResponse.json({thread},{status:201})
  } catch (error) {
    const code=error instanceof Error?error.message:'community_failed'
    const status=
      code==='google_required'?403:
      code==='community_blocked'?403:
      code==='community_rate_limited'?429:400
    return NextResponse.json({error:code},{status})
  }
}
