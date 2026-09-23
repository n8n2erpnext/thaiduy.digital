'use client'

import { FormEvent,useMemo,useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CommunityParticipant } from '@/community/data'
import { DiscussRichEditor } from '@/components/discuss/discuss-rich-editor'
import { DiscussionDeleteButton } from './discussion-delete-button'

type Props={
  locale:'en'|'vi'
  kind:'thread'|'reply'
  id:string
  initialTitle?:string
  initialBody:string
  initialBodyHtml?:string | null
  participants:CommunityParticipant[]
}

function plainToHtml(value:string) {
  const escaped=value
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
  return escaped.split(/\n{2,}/).map(block=>'<p>'+block.replace(/\n/g,'<br>')+'</p>').join('')
}

export function DiscussionEditForm({
  locale,kind,id,initialTitle='',initialBody,initialBodyHtml,participants,
}:Props) {
  const vi=locale==='vi'
  const router=useRouter()
  const [title,setTitle]=useState(initialTitle)
  const [body,setBody]=useState(initialBody)
  const [bodyHtml,setBodyHtml]=useState(initialBodyHtml ?? '')
  const [saving,setSaving]=useState(false)
  const [message,setMessage]=useState('')
  const maxLength=kind==='thread'?5000:3000
  const editorHtml=useMemo(
    ()=>initialBodyHtml?.trim() || plainToHtml(initialBody),
    [initialBody,initialBodyHtml],
  )

  async function submit(event:FormEvent) {
    event.preventDefault()
    if (body.trim().length<2 || body.length>maxLength) return
    if (kind==='thread' && (title.trim().length<3 || title.length>180)) return
    setSaving(true)
    setMessage('')
    try {
      const response=await fetch('/api/account/discussions/'+kind+'/'+id,{
        method:'PATCH',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({title,body,bodyHtml}),
      })
      const payload=await response.json() as {error?:string}
      if (response.ok) {
        setMessage(vi
          ? 'Đã lưu. Nội dung được chuyển về chờ duyệt.'
          : 'Saved. The content has returned to moderation.')
        router.push('/account/discussions')
        router.refresh()
      } else {
        const code=payload.error ?? ''
        setMessage(
          code==='community_blocked'
            ? (vi?'Tài khoản hiện không được phép chỉnh sửa nội dung.':'This account cannot currently edit Discuss content.')
            : code==='mention_not_allowed'
              ? (vi?'Một @mention trong nội dung không còn hợp lệ.':'A mention in this content is no longer valid.')
              : (vi?'Không thể lưu thay đổi lúc này.':'Could not save these changes right now.'),
        )
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="account-discussion-edit-form" onSubmit={submit}>
      {kind==='thread' && (
        <label>
          <span>{vi?'TIÊU ĐỀ':'TITLE'}</span>
          <input
            value={title}
            maxLength={180}
            onChange={event=>setTitle(event.target.value)}
          />
        </label>
      )}
      <label>
        <span>{vi?'NỘI DUNG':'CONTENT'}</span>
        <DiscussRichEditor
          locale={locale}
          participants={kind==='reply'?participants:[]}
          placeholder={vi?'Chỉnh sửa nội dung…':'Edit your content…'}
          maxLength={maxLength}
          resetKey={0}
          initialHtml={editorHtml}
          onChange={value=>{
            setBody(value.text)
            setBodyHtml(value.html)
          }}
        />
      </label>
      {message && <p className="account-form-message">{message}</p>}
      <footer>
        <button type="submit" disabled={saving || body.trim().length<2}>
          {saving?(vi?'ĐANG LƯU…':'SAVING…'):(vi?'LƯU & GỬI DUYỆT':'SAVE & REMODERATE')}
        </button>
        <DiscussionDeleteButton
          locale={locale}
          kind={kind}
          id={id}
          redirectAfter
        />
      </footer>
    </form>
  )
}
