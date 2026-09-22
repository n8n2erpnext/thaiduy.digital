import { headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GuestbookComposer } from '@/components/guestbook/guestbook-composer'
import { GuestbookLikeButton } from '@/components/guestbook/guestbook-like-button'
import { GuestbookReplyAction } from '@/components/guestbook/guestbook-reply-action'
import {
  getCommunityMemberState,
  getCommunityParticipants,
  getPublicCommunityThread,
  hasCommunityGoogleAccount,
  isCommunityAdminEmail,
} from '@/community/data'
import { resolveLocale } from '@/i18n/locale'
import { auth } from '@/lib/auth'
import { SiteHeader } from '@/components/site/header'

type Props={
  params:Promise<{id:string}>
  searchParams:Promise<{page?:string}>
}

function pageNumber(value:string | undefined) {
  const parsed=Number.parseInt(value ?? '1',10)
  return Number.isFinite(parsed) && parsed>0 ? parsed : 1
}

export default async function GuestbookThreadPage({params,searchParams}:Props) {
  const locale=await resolveLocale()
  const {id}=await params
  const {page:rawPage}=await searchParams
  const page=pageNumber(rawPage)
  const session=await auth.api.getSession({headers:await headers()})
  const [data,googleConnected,member,participants]=await Promise.all([
    getPublicCommunityThread(id,session?.user.id,page,20),
    session?.user?hasCommunityGoogleAccount(session.user.id):Promise.resolve(false),
    session?.user?getCommunityMemberState(session.user.id):Promise.resolve(null),
    getCommunityParticipants(id),
  ])
  if (!data) notFound()
  const viewer=session?.user?{
    name:session.user.name,
    image:session.user.image ?? null,
    googleConnected,
    blocked:member?.status==='blocked',
    isAdmin:isCommunityAdminEmail(session.user.email),
  }:null

  return (
    <div className="site-shell">
      <SiteHeader locale={locale} />
      <main className="guestbook-thread-page">
        <Link className="text-action" href="/guestbook">
          ← Discuss
        </Link>

        <article className="guestbook-thread-detail">
          <header>
            <span>{locale==='vi'?'DISCUSS / CHỦ ĐỀ':'DISCUSS / THREAD'}</span>
            <h1>{data.thread.title}</h1>
            <div className="guestbook-thread-author">
              {data.thread.authorImage
                ? <img src={data.thread.authorImage} alt="" />
                : <i>{data.thread.authorName.slice(0,2).toUpperCase()}</i>}
              <span>
                <strong>
                  {data.thread.authorName}
                  {data.thread.isAdmin && <span className="discuss-admin-badge">ADMIN</span>}
                </strong>
                <small>{data.thread.createdAt.toLocaleString(locale==='vi'?'vi-VN':'en-GB')}</small>
              </span>
            </div>
          </header>
          {data.thread.bodyHtml ? (
            <div
              className="guestbook-thread-message discuss-post-body"
              dangerouslySetInnerHTML={{__html:data.thread.bodyHtml}}
            />
          ) : (
            <p className="guestbook-thread-message">{data.thread.body}</p>
          )}
          <footer className="guestbook-thread-actions">
            <GuestbookLikeButton
              kind="thread"
              id={data.thread.id}
              locale={locale}
              initialLiked={Boolean(data.thread.liked)}
              initialCount={Number(data.thread.likeCount)}
              canLike={googleConnected}
              blocked={member?.status==='blocked'}
            />
            <span>{locale==='vi'?'Thích chủ đề này hoặc kéo xuống để phản hồi.':'Like this topic or continue below with a reply.'}</span>
          </footer>
        </article>

        <section className="guestbook-replies">
          <header id="replies">
            <span>{locale==='vi'?'PHẢN HỒI':'REPLIES'}</span>
            <strong>{data.replyPagination.total}</strong>
          </header>
          {data.replies.length===0 && (
            <p className="guestbook-replies-empty">
              {locale==='vi'?'Chưa có phản hồi được duyệt.':'No approved replies yet.'}
            </p>
          )}
          {data.replies.map(reply=>(
            <article className="guestbook-reply" key={reply.id}>
              {reply.authorImage
                ? <img src={reply.authorImage} alt="" />
                : <i>{reply.authorName.slice(0,2).toUpperCase()}</i>}
              <div>
                <header>
                  <strong>
                    {reply.authorName}
                    {reply.isAdmin && <span className="discuss-admin-badge">ADMIN</span>}
                  </strong>
                  <time>{reply.createdAt.toLocaleString(locale==='vi'?'vi-VN':'en-GB')}</time>
                </header>
                {reply.parentReplyId && reply.parentAuthorName && (
                  <blockquote className="guestbook-reply-reference">
                    <span>↪ @{reply.parentAuthorName}</span>
                    {reply.parentBody && (
                      <p>
                        {reply.parentBody.trim().replace(/\s+/g,' ').slice(0,180)}
                        {reply.parentBody.trim().length>180?'…':''}
                      </p>
                    )}
                  </blockquote>
                )}
                {reply.bodyHtml ? (
                  <div
                    className="discuss-post-body discuss-reply-body"
                    dangerouslySetInnerHTML={{__html:reply.bodyHtml}}
                  />
                ) : (
                  <p>{reply.body}</p>
                )}
                <footer>
                  <GuestbookLikeButton
                    kind="reply"
                    id={reply.id}
                    locale={locale}
                    initialLiked={Boolean(reply.liked)}
                    initialCount={Number(reply.likeCount)}
                    canLike={googleConnected}
                    blocked={member?.status==='blocked'}
                  />
                  <GuestbookReplyAction
                    locale={locale}
                    viewer={viewer}
                    threadId={id}
                    replyId={reply.id}
                    authorName={reply.authorName}
                    body={reply.body}
                    participants={participants}
                  />
                </footer>
              </div>
            </article>
          ))}
          {data.replyPagination.pages>1 && (
            <nav className="guestbook-pagination" aria-label={locale==='vi'?'Phân trang phản hồi':'Reply pagination'}>
              <Link
                href={data.replyPagination.page<=2?'/guestbook/'+id+'#replies':'/guestbook/'+id+'?page='+(data.replyPagination.page-1)+'#replies'}
                aria-disabled={data.replyPagination.page===1}
                data-disabled={data.replyPagination.page===1 || undefined}
              >
                ← {locale==='vi'?'TRƯỚC':'PREV'}
              </Link>
              <span>
                {locale==='vi'?'TRANG':'PAGE'} {data.replyPagination.page} / {data.replyPagination.pages}
              </span>
              <Link
                href={'/guestbook/'+id+'?page='+(data.replyPagination.page+1)+'#replies'}
                aria-disabled={data.replyPagination.page===data.replyPagination.pages}
                data-disabled={data.replyPagination.page===data.replyPagination.pages || undefined}
              >
                {locale==='vi'?'SAU':'NEXT'} →
              </Link>
            </nav>
          )}
        </section>

        <GuestbookComposer
          locale={locale}
          viewer={viewer}
          threadId={id}
          participants={participants}
        />
      </main>
    </div>
  )
}
