'use client'

import { FormEvent,useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

type Props={
  locale:'en'|'vi'
  initialName:string
}

export function AccountProfileForm({locale,initialName}:Props) {
  const vi=locale==='vi'
  const router=useRouter()
  const [name,setName]=useState(initialName)
  const [saving,setSaving]=useState(false)
  const [message,setMessage]=useState('')

  async function submit(event:FormEvent) {
    event.preventDefault()
    const clean=name.trim()
    if (clean.length<2 || clean.length>80) return
    setSaving(true)
    setMessage('')
    try {
      const response=await fetch('/api/account/profile',{
        method:'PATCH',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({name:clean}),
      })
      const payload=await response.json() as {error?:string}
      if (response.ok) {
        setMessage(vi?'Đã cập nhật tên hiển thị.':'Display name updated.')
        router.refresh()
      } else {
        setMessage(payload.error==='invalid_name'
          ? (vi?'Tên cần từ 2 đến 80 ký tự.':'Name must be between 2 and 80 characters.')
          : (vi?'Không thể cập nhật lúc này.':'Could not update your account right now.'))
      }
    } finally {
      setSaving(false)
    }
  }

  async function signOut() {
    await authClient.signOut({
      fetchOptions:{
        onSuccess:()=>{
          router.push('/')
          router.refresh()
        },
      },
    })
  }
  return (
    <div className="account-profile-actions">
      <form onSubmit={submit}>
        <label>
          <span>{vi?'TÊN HIỂN THỊ':'DISPLAY NAME'}</span>
          <input
            value={name}
            maxLength={80}
            onChange={event=>setName(event.target.value)}
          />
        </label>
        <button type="submit" disabled={saving || name.trim().length<2}>
          {saving?(vi?'ĐANG LƯU…':'SAVING…'):(vi?'LƯU TÊN':'SAVE NAME')}
        </button>
      </form>
      {message && <p>{message}</p>}
      <button className="account-signout-button" type="button" onClick={()=>void signOut()}>
        {vi?'ĐĂNG XUẤT':'SIGN OUT'}
      </button>
    </div>
  )
}
