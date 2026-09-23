import { NextRequest,NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import {
  deleteOwnedCommunityItem,
  updateOwnedCommunityItem,
} from '@/community/data'

type Props={params:Promise<{kind:string;id:string}>}
const payloadSchema=z.object({
  title:z.string().optional(),
  body:z.string().default(''),
  bodyHtml:z.string().nullable().optional(),
})

function kindOf(value:string) {
  return value==='thread'||value==='reply'?value:null
}
export async function PATCH(request:NextRequest,{params}:Props) {
  const session=await auth.api.getSession({headers:request.headers})
  if (!session?.user) return NextResponse.json({error:'auth_required'},{status:401})
  const {kind:rawKind,id}=await params
  const kind=kindOf(rawKind)
  if (!kind) return NextResponse.json({error:'invalid_kind'},{status:400})
  const parsed=payloadSchema.safeParse(await request.json().catch(()=>null))
  if (!parsed.success) return NextResponse.json({error:'invalid_payload'},{status:400})

  try {
    const item=await updateOwnedCommunityItem(kind,id,session.user.id,parsed.data)
    return NextResponse.json({item})
  } catch (error) {
    const code=error instanceof Error?error.message:'community_update_failed'
    const status=
      code==='community_item_not_found'?404:
      code==='google_required'||code==='community_blocked'||code==='mention_not_allowed'?403:400
    return NextResponse.json({error:code},{status})
  }
}
export async function DELETE(request:NextRequest,{params}:Props) {
  const session=await auth.api.getSession({headers:request.headers})
  if (!session?.user) return NextResponse.json({error:'auth_required'},{status:401})
  const {kind:rawKind,id}=await params
  const kind=kindOf(rawKind)
  if (!kind) return NextResponse.json({error:'invalid_kind'},{status:400})

  try {
    await deleteOwnedCommunityItem(kind,id,session.user.id)
    return NextResponse.json({ok:true})
  } catch (error) {
    const code=error instanceof Error?error.message:'community_delete_failed'
    const status=code==='community_item_not_found'?404:400
    return NextResponse.json({error:code},{status})
  }
}
