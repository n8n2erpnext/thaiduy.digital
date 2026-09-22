'use client'

import { useState } from 'react'
import type { CommunityParticipant } from '@/community/data'
import { GuestbookComposer } from './guestbook-composer'

type Viewer={
  name:string
  image:string | null
  googleConnected:boolean
  blocked:boolean
  isAdmin:boolean
}

type Props={
  locale:'en'|'vi'
  viewer:Viewer | null
  threadId:string
  replyId:string
  authorName:string
  body:string
  participants:CommunityParticipant[]
}

export function GuestbookReplyAction({
  locale,viewer,threadId,replyId,authorName,body,participants,
}:Props) {
  const vi=locale==='vi'
  const [open,setOpen]=useState(false)

  return (
    <>
      <button
        className="guestbook-reply-button"
        type="button"
        onClick={()=>setOpen(value=>!value)}
      >
        ↩ {open?(vi?'Đóng':'Close'):(vi?'Trả lời':'Reply')}
      </button>
      {open && (
        <div className="guestbook-inline-reply">
          <GuestbookComposer
            locale={locale}
            viewer={viewer}
            threadId={threadId}
            parentReplyId={replyId}
            replyTo={{name:authorName,body}}
            participants={participants}
          />
        </div>
      )}
    </>
  )
}
