'use client'

import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export function SignOutButton() {
  const router = useRouter()
  return (
    <button
      className="control-signout"
      type="button"
      onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => { router.push('/control/login'); router.refresh() } } })}
    >
      SIGN OUT
    </button>
  )
}
