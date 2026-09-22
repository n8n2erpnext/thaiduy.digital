'use client'

import { FormEvent,useState } from 'react'
import { authClient } from '@/lib/auth-client'

type Viewer={
  name:string
  image:string | null
  googleConnected:boolean
  blocked:boolean
}

type ReplyTarget={
  name:string
  body:string
}

type Props={
  locale:'en'|'vi'
  viewer:Viewer | null
  threadId?:string
  parentReplyId?:string
  replyTo?:ReplyTarget
}

export function GuestbookComposer({
  locale,viewer,threadId,parentReplyId,replyTo,
}:Props) {
  const vi=locale==='vi'
  const isReply=Boolean(threadId)
  const bodyLimit=isReply?3000:5000
  const [open,setOpen]=useState(isReply && Boolean(viewer?.googleConnected))
  const [title,setTitle]=useState('')
  const [body,setBody]=useState('')
  const [sending,setSending]=useState(false)
  const [message,setMessage]=useState('')
  async function googleLogin() {
    await authClient.signIn.social({
      provider:'google',
      callbackURL:window.location.pathname+window.location.search,
    })
  }

  function errorMessage(code:string) {
    if (code==='community_rate_limited') {
      return vi?'Bạn vừa gửi nội dung. Vui lòng chờ một chút rồi thử lại.':'You just posted. Please wait a moment and try again.'
    }
    if (code==='community_blocked') {
      return vi?'Tài khoản này hiện không được phép đăng trong Discuss.':'This account cannot currently post in Discuss.'
    }
    if (code==='parent_reply_not_found') {
      return vi?'Phản hồi gốc không còn khả dụng.':'The reply you are responding to is no longer available.'
    }
    if (code==='title_length_invalid') {
      return vi?'Tiêu đề cần từ 3 đến 180 ký tự.':'Title must be between 3 and 180 characters.'
    }
    if (code==='body_length_invalid') {
      return vi?'Nội dung quá ngắn hoặc vượt giới hạn.':'The message is too short or exceeds the limit.'
    }
    return vi?'Không thể gửi nội dung lúc này.':'Could not submit this message right now.'
  }

  async function submit(event:FormEvent) {
    event.preventDefault()
    if (!viewer?.googleConnected) return void googleLogin()
    if (viewer.blocked) return
    if (!body.trim() || (!isReply && title.trim().length<3)) return

    setSending(true)
    setMessage('')
    try {
      const endpoint=isReply
        ? '/api/guestbook/threads/'+encodeURIComponent(threadId!)+'/replies'
        : '/api/guestbook/threads'
      const response=await fetch(endpoint,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(isReply
          ? {body,parentReplyId:parentReplyId ?? null}
          : {title,body,locale}),
      })
      const payload=await response.json() as {error?:string}
      if (response.ok) {
        setTitle('')
        setBody('')
        setMessage(vi
          ? (isReply?'Đã gửi phản hồi. Nội dung sẽ xuất hiện sau khi được duyệt.':'Đã gửi chủ đề. Bài sẽ xuất hiện sau khi được duyệt.')
          : (isReply?'Reply submitted. It will appear after moderation.':'Topic submitted. It will appear after moderation.'))
      } else if (payload.error==='auth_required' || payload.error==='google_required') {
        await googleLogin()
      } else {
        setMessage(errorMessage(payload.error ?? 'community_failed'))
      }
    } finally {
      setSending(false)
    }
  }

  const signedIn=Boolean(viewer?.googleConnected)
  const showEditor=signedIn && (isReply || open)
  const targetPreview=replyTo?.body.trim().replace(/\s+/g,' ').slice(0,180)

  return (
    <section
      className={'guestbook-composer'+(isReply?' is-reply':'')+(replyTo?' is-targeted':'')+(showEditor?' is-open':' is-compact')}
    >
      <header>
        <div>
          <span>
            {replyTo
              ? (vi?'TRẢ LỜI BÌNH LUẬN':'REPLY TO COMMENT')
              : isReply
                ? (vi?'PHẢN HỒI CHỦ ĐỀ':'REPLY TO TOPIC')
                : (vi?'DISCUSS / CHỦ ĐỀ':'DISCUSS / TOPICS')}
          </span>
          <strong>
            {replyTo
              ? (vi?`Trả lời @${replyTo.name}`:`Reply to @${replyTo.name}`)
              : isReply
                ? (vi?'Trả lời nội dung chính':'Reply to the main topic')
                : (vi?'Tham gia cuộc trao đổi':'Join the conversation')}
          </strong>
        </div>

        {!signedIn ? (
          <button className="guestbook-google-login" type="button" onClick={()=>void googleLogin()}>
            <b>G</b>
            <span>{vi?'Đăng nhập Google':'Continue with Google'}</span>
          </button>
        ) : !isReply ? (
          <button
            className="guestbook-new-thread-button"
            type="button"
            disabled={viewer?.blocked}
            onClick={()=>setOpen(value=>!value)}
          >
            {open
              ? (vi?'ĐÓNG':'CLOSE')
              : (vi?'+ TẠO CHỦ ĐỀ MỚI':'+ NEW TOPIC')}
          </button>
        ) : null}
      </header>

      {replyTo && targetPreview && (
        <blockquote className="guestbook-reply-target">
          <span>↪ @{replyTo.name}</span>
          <p>{targetPreview}{replyTo.body.trim().length>180?'…':''}</p>
        </blockquote>
      )}

      {showEditor && (
        <>
          <div className="guestbook-viewer">
            {viewer?.image
              ? <img src={viewer.image} alt="" />
              : <i>{viewer?.name.slice(0,2).toUpperCase()}</i>}
            <div><strong>{viewer?.name}</strong><small>GOOGLE ACCOUNT</small></div>
            {viewer?.blocked && <em>{vi?'ĐÃ BỊ KHÓA ĐĂNG':'POSTING BLOCKED'}</em>}
          </div>

          <form onSubmit={submit}>
            {!isReply && (
              <label>
                <span className="guestbook-field-row">
                  <span>{vi?'TIÊU ĐỀ':'TITLE'}</span>
                  <small>{title.length} / 180</small>
                </span>
                <input
                  value={title}
                  maxLength={180}
                  onChange={event=>setTitle(event.target.value)}
                  placeholder={vi?'Bạn muốn nói về điều gì?':'What would you like to talk about?'}
                  disabled={viewer?.blocked || sending}
                />
              </label>
            )}
            <label>
              <span className="guestbook-field-row">
                <span>
                  {replyTo
                    ? (vi?'TRẢ LỜI':'REPLY')
                    : isReply
                      ? (vi?'PHẢN HỒI CHỦ ĐỀ':'TOPIC REPLY')
                      : (vi?'NỘI DUNG':'MESSAGE')}
                </span>
                <small>{body.length} / {bodyLimit}</small>
              </span>
              <textarea
                rows={isReply?4:6}
                value={body}
                maxLength={bodyLimit}
                onChange={event=>setBody(event.target.value)}
                placeholder={replyTo
                  ? (vi?`Trả lời @${replyTo.name}…`:`Reply to @${replyTo.name}…`)
                  : isReply
                    ? (vi?'Viết phản hồi cho chủ đề…':'Reply to this topic…')
                    : (vi?'Một lời chào, câu hỏi, góp ý hoặc chủ đề muốn trao đổi…':'A hello, question, thought, or something worth discussing…')}
                disabled={viewer?.blocked || sending}
              />
            </label>
            <footer>
              <small>
                {viewer?.blocked
                  ? (vi?'Bạn vẫn có thể đọc Discuss nhưng hiện không thể đăng.':'You can still read Discuss, but posting is disabled for this account.')
                  : (vi?'Nội dung được duyệt trước khi hiển thị công khai.':'Messages are moderated before they become public.')}
              </small>
              {!viewer?.blocked && (
                <button type="submit" disabled={sending || body.trim().length<2 || (!isReply && title.trim().length<3)}>
                  {sending
                    ? (vi?'ĐANG GỬI…':'SENDING…')
                    : (isReply?(vi?'GỬI PHẢN HỒI':'SUBMIT REPLY'):(vi?'GỬI CHỦ ĐỀ':'SUBMIT TOPIC'))}
                </button>
              )}
            </footer>
          </form>
        </>
      )}

      {!signedIn && !replyTo && (
        <p className="guestbook-login-note">
          {vi
            ? 'Đọc tự do. Đăng nhập Google khi muốn tạo chủ đề, phản hồi hoặc thích một bài.'
            : 'Read freely. Sign in with Google to create topics, reply, or like a post.'}
        </p>
      )}
      {message && <p className="guestbook-form-message">{message}</p>}
    </section>
  )
}
