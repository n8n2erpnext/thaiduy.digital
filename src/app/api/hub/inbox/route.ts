import { desc, gt, sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/db/client'
import { contactMessages } from '@/db/schema'
import { authenticateHubDevice, HUB_INBOX_SCOPE } from '@/lib/hub-device-auth'

export const dynamic='force-dynamic'

export async function GET(request:Request) {
  const device=await authenticateHubDevice(request.headers.get('authorization'),HUB_INBOX_SCOPE)
  if(!device) return NextResponse.json({error:'unauthorized'},{status:401})

  const url=new URL(request.url)
  const limit=Math.min(50,Math.max(1,Number(url.searchParams.get('limit')||20)))
  const afterRaw=url.searchParams.get('after')
  const after=afterRaw?new Date(afterRaw):null
  const validAfter=after&&Number.isFinite(after.getTime())?after:null

  const base=db.select({
    id:contactMessages.id,
    name:contactMessages.name,
    email:contactMessages.email,
    phone:contactMessages.phone,
    message:contactMessages.message,
    locale:contactMessages.locale,
    status:contactMessages.status,
    sourcePath:contactMessages.sourcePath,
    createdAt:contactMessages.createdAt,
  }).from(contactMessages)

  const messages=validAfter
    ? await base.where(gt(contactMessages.createdAt,validAfter)).orderBy(desc(contactMessages.createdAt)).limit(limit)
    : await base.orderBy(desc(contactMessages.createdAt)).limit(limit)

  const [countRow]=await db.select({
    count:sql<number>`count(*)::int`,
  }).from(contactMessages).where(sql`${contactMessages.status} = 'new'`)

  return NextResponse.json({
    messages,
    newCount:Number(countRow?.count??0),
    latestAt:messages[0]?.createdAt?.toISOString()??null,
  },{headers:{'Cache-Control':'no-store'}})
}
