import { headers } from 'next/headers'
import Link from 'next/link'
import { GuestbookComposer } from '@/components/guestbook/guestbook-composer'
import { SectionPage } from '@/components/site/section-page'
import {
  getCommunityMemberState,
  getPublicCommunityThreads,
  hasCommunityGoogleAccount,
} from '@/community/data'
import { resolveManagedSection } from '@/content/presentation'
import { resolveLocale } from '@/i18n/locale'
import { messages } from '@/i18n/messages'
import { auth } from '@/lib/auth'

export default async function GuestbookPage() {
  const locale=await resolveLocale()
  const t=messages[locale]
  const session=await auth.api.getSession({headers:await headers()})
  const [section,threads,googleConnected,member]=await Promise.all([
    resolveManagedSection('section.guestbook',locale,t.sections.guestbook),
    getPublicCommunityThreads(),
    session?.user?hasCommunityGoogleAccount(session.user.id):Promise.resolve(false),
    session?.user?getCommunityMemberState(session.user.id):Promise.resolve(null),
  ])
  const viewer=session?.user?{
    name:session.user.name,
    image:session.user.image ?? null,
    googleConnected,
    blocked:member?.status==='blocked',
  }:null

  return (
    <SectionPage
      locale={locale}
      eyebrow={section.eyebrow}
      title={section.title}
      copy={section.copy}
      managed={section.managed}
    >
      <div className="guestbook-page">
        <GuestbookComposer locale={locale} viewer={viewer} />
        <section className="guestbook-thread-list">
          <header>
            <div>
              <span>{locale==='vi'?'CUỘC TRAO ĐỔI':'CONVERSATIONS'}</span>
              <h2>{locale==='vi'?'Những lời nhắn đã được duyệt':'Approved threads'}</h2>
            </div>
            <strong>{threads.length.toLocaleString(locale==='vi'?'vi-VN':'en-US')}</strong>
          </header>
          {threads.length===0 && (
            <div className="guestbook-empty">
              <strong>{locale==='vi'?'Guestbook đang còn trống.':'The Guestbook is quiet for now.'}</strong>
              <p>{locale==='vi'?'Bạn có thể là người mở lời đầu tiên.':'You can be the first person to leave a message.'}</p>
            </div>
          )}
          {threads.map(thread=>(
            <Link className="guestbook-thread-card" href={'/guestbook/'+thread.id} key={thread.id}>
              <div className="guestbook-thread-author">
                {thread.authorImage
                  ? <img src={thread.authorImage} alt="" />
                  : <i>{thread.authorName.slice(0,2).toUpperCase()}</i>}
                <span>
                  <strong>{thread.authorName}</strong>
                  <small>{thread.createdAt.toLocaleDateString(locale==='vi'?'vi-VN':'en-GB')}</small>
                </span>
              </div>
              <div className="guestbook-thread-copy">
                <h3>{thread.title}</h3>
                <p>{thread.body}</p>
              </div>
              <div className="guestbook-thread-meta">
                <span>{thread.replyCount} {locale==='vi'?'phản hồi':'replies'}</span>
                <time>{locale==='vi'?'HOẠT ĐỘNG':'ACTIVE'} · {thread.lastActivityAt.toLocaleDateString(locale==='vi'?'vi-VN':'en-GB')}</time>
                <b>→</b>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </SectionPage>
  )
}
