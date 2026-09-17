'use client'

import { useState } from 'react'
import { authClient } from '@/lib/auth-client'

export function ControlLoginButton() {
  const [pending, setPending] = useState(false)

  async function signIn() {
    setPending(true)
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/control',
    })
  }

  return (
    <button className="control-login-button" type="button" disabled={pending} onClick={signIn}>
      {pending ? 'CONNECTING…' : 'SIGN IN WITH GOOGLE'}
    </button>
  )
}
