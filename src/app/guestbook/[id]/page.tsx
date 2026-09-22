import { headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GuestbookComposer } from '@/components/guestbook/guestbook-composer'
import {
  getCommunityMemberState,
  getPublicCommunityThread,
  hasCommunityGoogleAccount,
} from '@/community/data'
import { resolveLocale } from '@/i18n/locale'
import { auth } from '@/lib/auth'
import { SiteHeader } from '@/components/site/header'

type Props={params:Promise<{id:string}>}

export default async function GuestbookThreadPage({params}:Props) {
  const locale=await resolveLocale()
  const {id}=await params
  const session=await auth.api.getSession({headers:await headers()})
  const [data,googleConnected,member]=await Promise.all([
    getPublicCommunityThread(id),
    session?.user?hasCommunityGoogleAccount(session.user.id):Promise.resolve(false),
    session?.user?getCommunityMemberState(session.user.id):Promise.resolve(null),
  ])
  if (!data) notFound()
  const viewer=session?.user?{
    name:session.user.name,
    image:session.user.image ?? null,
    googleConnected,
    blocked:member?.status==='blocked',
  }:null

  return (
    <div className="site-shell">
      <SiteHeader locale={locale} />
      <main className="guestbook-thread-page">
        <Link className="text-action" href="/guestbook">
          ← {locale==='vi'?'Guestbook':'Guestbook'}
        </Link>

        <article className="guestbook-thread-detail">
          <header>
            <span>{locale==='vi'?'GUESTBOOK / CHỦ ĐỀ':'GUESTBOOK / THREAD'}</span>
            <h1>{data.thread.title}</h1>
            <div className="guestbook-thread-author">
              {data.thread.authorImage
                ? <img src={data.thread.authorImage} alt="" />
                : <i>{data.thread.authorName.slice(0,2).toUpperCase()}</i>}
              <span>
                <strong>{data.thread.authorName}</strong>
                <small>{data.thread.createdAt.toLocaleString(locale==='vi'?'vi-VN':'en-GB')}</small>
              </span>
            </div>
          </header>
          <p className="guestbook-thread-message">{data.thread.body}</p>
        </article>

        <section className="guestbook-replies">
          <header>
            <span>{locale==='vi'?'PHẢN HỒI':'REPLIES'}</span>
            <strong>{data.replies.length}</strong>
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
                  <strong>{reply.authorName}</strong>
                  <time>{reply.createdAt.toLocaleString(locale==='vi'?'vi-VN':'en-GB')}</time>
                </header>
                <p>{reply.body}</p>
              </div>
            </article>
          ))}
        </section>

        <GuestbookComposer locale={locale} viewer={viewer} threadId={id} />
      </main>
    </div>
  )
}
