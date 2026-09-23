import { NextResponse } from 'next/server'
import {
  clearHubControlSessionFromHeaders,
  HUB_CONTROL_COOKIE,
} from '@/lib/hub-control-session'

export async function POST(request:Request) {
  await clearHubControlSessionFromHeaders(request.headers)
  const response=NextResponse.json({ ok:true },{ headers:{ 'Cache-Control':'no-store' } })
  response.cookies.set(HUB_CONTROL_COOKIE,'',{
    httpOnly:true,
    secure:true,
    sameSite:'lax',
    path:'/',
    maxAge:0,
  })
  return response
}
