'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

type Props = { email: string }

export function CredentialLogin({ email }: Props) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password') ?? '')
    const result = await authClient.signIn.email({ email, password, callbackURL: '/control' })
    if (result.error) {
      setPending(false)
      setError('PASSWORD SIGN-IN FAILED')
      return
    }
    router.push('/control')
    router.refresh()
  }

  return (
    <form className="control-credential-form" onSubmit={submit}>
      <label><span>OWNER EMAIL</span><input value={email} readOnly /></label>
      <label><span>PASSWORD</span><input name="password" type="password" minLength={8} required autoComplete="current-password" /></label>
      {error && <strong>{error}</strong>}
      <button className="control-login-button" type="submit" disabled={pending}>{pending ? 'AUTHENTICATING…' : 'SIGN IN WITH PASSWORD'}</button>
    </form>
  )
}
