import { NextRequest,NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPublishedPostBySlug } from '@/content/posts'
import { hasGoogleAccount,toggleArticleLike } from '@/content/engagement'
import { requestOriginAllowed } from '@/lib/request-security'

type Props = { params: Promise<{ slug:string }> }

export async function POST(request:NextRequest,{ params }:Props) {
  if (!requestOriginAllowed(request)) return NextResponse.json({ error:'origin_forbidden' },{ status:403 })
  const session = await auth.api.getSession({ headers:request.headers })
  if (!session?.user) return NextResponse.json({ error:'auth_required' },{ status:401 })
  if (!await hasGoogleAccount(session.user.id)) {
    return NextResponse.json({ error:'google_required' },{ status:403 })
  }

  const { slug } = await params
  const post = await getPublishedPostBySlug(slug)
  if (!post) return NextResponse.json({ error:'post_not_found' },{ status:404 })

  return NextResponse.json(await toggleArticleLike(post.id,session.user.id))
}
