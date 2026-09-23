'use client'

import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export function SignOutButton() {
  const router = useRouter()

  async function signOut() {
    await fetch('/api/hub/control/logout',{ method:'POST' }).catch(() => null)
    await authClient.signOut().catch(() => null)
    router.push('/control/login')
    router.refresh()
  }

  return (
    <button
      className="control-signout"
      type="button"
      onClick={signOut}
    >
      SIGN OUT
    </button>
  )
}
