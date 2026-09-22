'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { assetUploadMessage } from '@/lib/asset-errors'

export function AssetUpload() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form=event.currentTarget
    setPending(true)
    setMessage('')
    try {
      const response=await fetch('/api/control/assets',{
        method:'POST',
        body:new FormData(form),
        credentials:'same-origin',
      })
      const payload=await response.json() as {
        error?:string
        provider?:'r2'|'local'
      }
      if (!response.ok) {
        setMessage(assetUploadMessage(payload.error ?? 'asset_upload_failed'))
        return
      }
      form.reset()
      setMessage(`UPLOAD VERIFIED · ${(payload.provider ?? 'storage').toUpperCase()} READY`)
      router.refresh()
    } catch {
      setMessage('Upload request failed before R2 verification.')
    } finally {
      setPending(false)
    }
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
