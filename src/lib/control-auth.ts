import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getHubControlIdentity } from '@/lib/hub-control-session'

function ownerEmail() {
  return process.env.CONTROL_OWNER_EMAIL?.trim().toLowerCase() ?? ''
}

export async function getControlIdentityFromHeaders(requestHeaders:Headers) {
  const expectedOwner=ownerEmail()
  const session=await auth.api.getSession({ headers:requestHeaders })

  if (!expectedOwner) {
    return { state:'locked' as const, session }
  }

  if (session?.user?.email.toLowerCase()===expectedOwner) {
    return { state:'owner' as const, session }
  }

  const hubSession=await getHubControlIdentity(requestHeaders)
  if (hubSession?.user.email.toLowerCase()===expectedOwner) {
    return { state:'owner' as const, session:hubSession }
  }

  if (session?.user) {
    return { state:'forbidden' as const, session }
  }

  return { state:'anonymous' as const, session:null }
}

export async function getControlIdentity() {
  return getControlIdentityFromHeaders(await headers())
}

export async function requireControlOwner() {
  const identity=await getControlIdentity()
  if (identity.state==='anonymous') redirect('/control/login')
  if (identity.state!=='owner') redirect('/control/login?denied=1')
  return identity.session
}

export async function requireBetterAuthControlOwner() {
  const requestHeaders=await headers()
  const session=await auth.api.getSession({ headers:requestHeaders })
  const expectedOwner=ownerEmail()
  if (!session?.user || !expectedOwner) redirect('/control/login')
  if (session.user.email.toLowerCase()!==expectedOwner) {
    redirect('/control/login?denied=1')
  }
  return session
}
