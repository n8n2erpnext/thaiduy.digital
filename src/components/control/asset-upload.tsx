'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export function AssetUpload() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setMessage('')
    const response = await fetch('/api/control/assets', {
      method: 'POST',
      body: new FormData(event.currentTarget),
      credentials: 'same-origin',
    })
    const payload = await response.json() as { error?: string }
    setPending(false)
    if (!response.ok) {
      setMessage(payload.error ?? 'UPLOAD FAILED')
      return
    }
    event.currentTarget.reset()
    setMessage('UPLOAD COMPLETE')
    router.refresh()
  }

  return (
    <form className="control-form asset-upload-form" onSubmit={submit}>
      <label><span>FILE</span><input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif,application/pdf" required /></label>
      <label><span>ALT / EN</span><input name="altEn" type="text" maxLength={500} /></label>
      <label><span>ALT / VI</span><input name="altVi" type="text" maxLength={500} /></label>
      <button className="control-primary-button" type="submit" disabled={pending}>{pending ? 'UPLOADING…' : 'UPLOAD ASSET'}</button>
      {message && <small>{message}</small>}
    </form>
  )
}
