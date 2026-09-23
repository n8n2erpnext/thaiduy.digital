import { NextResponse } from 'next/server'
import { authenticateHubDevice, HUB_CONTROL_SCOPE } from '@/lib/hub-device-auth'
import { issueHubControlTicket } from '@/lib/hub-control-session'

export async function POST(request:Request) {
  const device=await authenticateHubDevice(
    request.headers.get('authorization'),
    HUB_CONTROL_SCOPE,
  )
  if (!device) {
    return NextResponse.json({ error:'unauthorized' },{ status:401 })
  }

  const ticket=await issueHubControlTicket(device.id)
  if (!ticket) {
    return NextResponse.json({ error:'control_session_unavailable' },{ status:403 })
  }

  return NextResponse.json({
    bootstrapUrl:'https://thaiduy.digital/api/hub/control/consume?ticket='+encodeURIComponent(ticket),
    expiresIn:30,
  },{ headers:{ 'Cache-Control':'no-store' } })
}
