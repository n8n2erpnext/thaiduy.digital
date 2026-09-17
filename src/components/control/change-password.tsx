'use client'

import { FormEvent, useState } from 'react'
import { authClient } from '@/lib/auth-client'

export function ChangePasswordForm() {
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setMessage('')
    const form = new FormData(event.currentTarget)
    const currentPassword = String(form.get('currentPassword') ?? '')
    const newPassword = String(form.get('newPassword') ?? '')
    const result = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true })
    if (result.error) {
      setPending(false)
      setMessage('PASSWORD CHANGE FAILED')
      return
    }
    event.currentTarget.reset()
    setPending(false)
    setMessage('PASSWORD UPDATED · OTHER SESSIONS REVOKED')
  }

  return (
    <form className="control-form" onSubmit={submit}>
      <label><span>CURRENT PASSWORD</span><input name="currentPassword" type="password" minLength={8} required autoComplete="current-password" /></label>
      <label><span>NEW PASSWORD</span><input name="newPassword" type="password" minLength={12} required autoComplete="new-password" /></label>
      {message && <strong>{message}</strong>}
      <button className="control-primary-button" type="submit" disabled={pending}>{pending ? 'UPDATING…' : 'CHANGE PASSWORD'}</button>
    </form>
  )
}
