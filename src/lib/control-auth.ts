import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export async function getControlIdentity() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return { state: 'anonymous' as const, session: null }

  const ownerEmail = process.env.CONTROL_OWNER_EMAIL?.trim().toLowerCase()
  if (!ownerEmail) return { state: 'locked' as const, session }
  if (session.user.email.toLowerCase() !== ownerEmail) {
    return { state: 'forbidden' as const, session }
  }

  return { state: 'owner' as const, session }
}

export async function requireControlOwner() {
  const identity = await getControlIdentity()
  if (identity.state === 'anonymous') redirect('/control/login')
  if (identity.state !== 'owner') redirect('/control/login?denied=1')
  return identity.session
}
