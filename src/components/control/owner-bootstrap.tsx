'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

type Props = { email: string }

export function OwnerBootstrap({ email }: Props) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password') ?? '')
    const result = await authClient.signUp.email({ name: 'Thai Duy', email, password })
    if (result.error) {
      setPending(false)
      setError('OWNER INITIALIZATION FAILED')
      return
    }
    router.push('/control')
    router.refresh()
  }

  return (
    <form className="control-credential-form" onSubmit={submit}>
      <label><span>OWNER EMAIL</span><input value={email} readOnly /></label>
      <label><span>TEMPORARY PASSWORD</span><input name="password" type="password" minLength={12} required autoComplete="new-password" /></label>
      {error && <strong>{error}</strong>}
      <button className="control-login-button" type="submit" disabled={pending}>{pending ? 'INITIALIZING…' : 'INITIALIZE OWNER'}</button>
    </form>
  )
}
