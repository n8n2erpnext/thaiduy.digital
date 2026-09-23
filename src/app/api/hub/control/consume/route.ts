import { NextResponse } from 'next/server'
import {
  consumeHubControlTicket,
  HUB_CONTROL_COOKIE,
  HUB_CONTROL_SESSION_TTL_SECONDS,
} from '@/lib/hub-control-session'

export async function GET(request:Request) {
  const url=new URL(request.url)
  const ticket=url.searchParams.get('ticket')?.trim() ?? ''
  if (!/^[A-Za-z0-9_-]{20,80}$/.test(ticket)) {
    return NextResponse.redirect(new URL('/control/login?hub=invalid',request.url),303)
  }

  const consumed=await consumeHubControlTicket(ticket)
  if (!consumed) {
    return NextResponse.redirect(new URL('/control/login?hub=expired',request.url),303)
  }

  const response=NextResponse.redirect(new URL('/control',request.url),303)
  response.cookies.set(HUB_CONTROL_COOKIE,consumed.token,{
    httpOnly:true,
    secure:true,
    sameSite:'lax',
    path:'/',
    maxAge:HUB_CONTROL_SESSION_TTL_SECONDS,
  })
  response.headers.set('Cache-Control','no-store')
  return response
}
