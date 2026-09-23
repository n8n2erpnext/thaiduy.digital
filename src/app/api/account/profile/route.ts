import { NextRequest,NextResponse } from 'next/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/db/client'
import { user } from '@/db/auth-schema'
import { requestOriginAllowed } from '@/lib/request-security'

const schema=z.object({
  name:z.string().trim().min(2).max(80),
})

export async function PATCH(request:NextRequest) {
  if (!requestOriginAllowed(request)) return NextResponse.json({error:'origin_forbidden'},{status:403})
  const session=await auth.api.getSession({headers:request.headers})
  if (!session?.user) return NextResponse.json({error:'auth_required'},{status:401})
  const parsed=schema.safeParse(await request.json().catch(()=>null))
  if (!parsed.success) return NextResponse.json({error:'invalid_name'},{status:400})
  const [updated]=await db.update(user).set({
    name:parsed.data.name,
    updatedAt:new Date(),
  }).where(eq(user.id,session.user.id)).returning({
    id:user.id,
    name:user.name,
  })
  if (!updated) return NextResponse.json({error:'user_not_found'},{status:404})
  return NextResponse.json({user:updated})
}
