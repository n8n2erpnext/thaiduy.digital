'use client'

import { FormEvent,useState } from 'react'
import { authClient } from '@/lib/auth-client'

type Comment = {
  id:string
  body:string
  createdAt:string
  authorName:string
  authorImage:string | null
}

type Props = {
  slug:string
  locale:'en'|'vi'
  initialLikeCount:number
  initialLiked:boolean
  comments:Comment[]
  viewer:{
    name:string
    image:string | null
    googleConnected:boolean
  } | null
}

export function ArticleEngagement({
  slug,locale,initialLikeCount,initialLiked,comments,viewer,
}:Props) {
  const [liked,setLiked] = useState(initialLiked)
  const [likeCount,setLikeCount] = useState(initialLikeCount)
  const [pendingLike,setPendingLike] = useState(false)
  const [body,setBody] = useState('')
  const [sending,setSending] = useState(false)
  const [message,setMessage] = useState('')

  const vi = locale === 'vi'
  async function googleLogin() {
    await authClient.signIn.social({
      provider:'google',
      callbackURL:window.location.pathname,
    })
  }

  async function toggleLike() {
    if (!viewer?.googleConnected) return void googleLogin()
    setPendingLike(true)
    try {
      const response = await fetch('/api/writing/' + encodeURIComponent(slug) + '/like',{
        method:'POST',
      })
      const payload = await response.json() as {
        liked?:boolean
        likeCount?:number
        error?:string
      }
      if (response.ok) {
        setLiked(Boolean(payload.liked))
        setLikeCount(Number(payload.likeCount ?? 0))
      } else if (payload.error === 'auth_required' || payload.error === 'google_required') {
        await googleLogin()
      }
    } finally {
      setPendingLike(false)
    }
  }

  async function submit(event:FormEvent) {
    event.preventDefault()
    if (!viewer?.googleConnected) return void googleLogin()
    if (!body.trim()) return
    setSending(true)
    setMessage('')
    try {
      const response = await fetch('/api/writing/' + encodeURIComponent(slug) + '/comments',{
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body:JSON.stringify({ body }),
      })
      const payload = await response.json() as { error?:string }
      if (response.ok) {
        setBody('')
        setMessage(vi
          ? 'Đã gửi. Bình luận sẽ xuất hiện sau khi được duyệt.'
          : 'Submitted. Your comment will appear after moderation.')
      } else if (payload.error === 'comment_rate_limited') {
        setMessage(vi ? 'Vui lòng chờ một chút trước khi gửi tiếp.' : 'Please wait a moment before commenting again.')
      } else if (payload.error === 'auth_required' || payload.error === 'google_required') {
        await googleLogin()
      } else {
        setMessage(vi ? 'Không thể gửi bình luận.' : 'Could not submit the comment.')
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="writing-engagement">
      <div className="writing-engagement-head">
        <div>
          <span>{vi ? 'TƯƠNG TÁC' : 'DISCUSSION'}</span>
          <h2>{vi ? 'Phản hồi bài viết' : 'Join the discussion'}</h2>
        </div>
        <button
          type="button"
          className="writing-like-button"
          data-liked={liked || undefined}
          disabled={pendingLike}
          onClick={() => void toggleLike()}
        >
          <i>♡</i>
          <strong>{likeCount}</strong>
          <span>{vi ? 'THÍCH' : 'LIKE'}</span>
        </button>
      </div>
      <form className="writing-comment-form" onSubmit={submit}>
        {viewer?.googleConnected ? (
          <div className="writing-comment-viewer">
            {viewer.image
              ? <img src={viewer.image} alt="" />
              : <i>{viewer.name.slice(0,2).toUpperCase()}</i>}
            <span>{viewer.name}</span>
            <small>GOOGLE</small>
          </div>
        ) : (
          <button className="writing-google-login" type="button" onClick={() => void googleLogin()}>
            G&nbsp;&nbsp;{vi ? 'ĐĂNG NHẬP GOOGLE ĐỂ BÌNH LUẬN' : 'CONTINUE WITH GOOGLE TO COMMENT'}
          </button>
        )}

        <textarea
          value={body}
          onChange={event => setBody(event.target.value.slice(0,3000))}
          placeholder={vi ? 'Viết bình luận…' : 'Leave a comment…'}
          disabled={!viewer?.googleConnected || sending}
          rows={4}
        />
        <div className="writing-comment-form-foot">
          <small>
            {viewer?.googleConnected
              ? (vi ? 'Bình luận được duyệt trước khi hiển thị.' : 'Comments are moderated before publication.')
              : (vi ? 'Google account được dùng cho tên và ảnh đại diện.' : 'Your Google account provides your name and avatar.')}
          </small>
          {viewer?.googleConnected && (
            <button type="submit" disabled={sending || body.trim().length < 2}>
              {sending ? (vi ? 'ĐANG GỬI…' : 'SENDING…') : (vi ? 'GỬI BÌNH LUẬN' : 'SUBMIT COMMENT')}
            </button>
          )}
        </div>
        {message && <p className="writing-comment-message">{message}</p>}
      </form>
      <div className="writing-comments">
        <div className="writing-comments-title">
          <span>{comments.length}</span>
          <strong>{vi ? 'BÌNH LUẬN ĐÃ DUYỆT' : 'APPROVED COMMENTS'}</strong>
        </div>
        {comments.length === 0 && (
          <p className="writing-comments-empty">
            {vi ? 'Chưa có bình luận được duyệt.' : 'No approved comments yet.'}
          </p>
        )}
        {comments.map(comment => (
          <article className="writing-comment" key={comment.id}>
            {comment.authorImage
              ? <img src={comment.authorImage} alt="" />
              : <i>{comment.authorName.slice(0,2).toUpperCase()}</i>}
            <div>
              <header>
                <strong>{comment.authorName}</strong>
                <time>{new Date(comment.createdAt).toLocaleDateString(vi ? 'vi-VN' : 'en-GB')}</time>
              </header>
              <p>{comment.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
