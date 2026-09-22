'use client'

import { useState } from 'react'
import { authClient } from '@/lib/auth-client'

type Props={
  kind:'thread'|'reply'
  id:string
  locale:'en'|'vi'
  initialLiked:boolean
  initialCount:number
  canLike:boolean
  blocked:boolean
}

export function GuestbookLikeButton({
  kind,id,locale,initialLiked,initialCount,canLike,blocked,
}:Props) {
  const vi=locale==='vi'
  const [liked,setLiked]=useState(initialLiked)
  const [count,setCount]=useState(initialCount)
  const [pending,setPending]=useState(false)

  async function googleLogin() {
    await authClient.signIn.social({
      provider:'google',
      callbackURL:window.location.pathname,
    })
  }
  async function toggle() {
    if (!canLike) return void googleLogin()
    if (blocked || pending) return

    setPending(true)
    try {
      const response=await fetch('/api/guestbook/likes',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({kind,id}),
      })
      const payload=await response.json() as {
        liked?:boolean
        likeCount?:number
        error?:string
      }
      if (response.ok) {
        setLiked(Boolean(payload.liked))
        setCount(Number(payload.likeCount ?? 0))
      } else if (payload.error==='auth_required' || payload.error==='google_required') {
        await googleLogin()
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      className="guestbook-like"
      data-liked={liked || undefined}
      type="button"
      disabled={pending || blocked}
      onClick={()=>void toggle()}
      title={blocked
        ? (vi?'Tài khoản này hiện không thể tương tác':'This account cannot currently interact')
        : (liked?(vi?'Bỏ thích':'Unlike'):(vi?'Thích':'Like'))}
    >
      <span aria-hidden="true">{liked?'♥':'♡'}</span>
      <strong>{count}</strong>
      <small>{vi?'THÍCH':'LIKE'}</small>
    </button>
  )
}
