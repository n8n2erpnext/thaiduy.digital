import { headers } from 'next/headers'
import Link from 'next/link'
import { GuestbookComposer } from '@/components/guestbook/guestbook-composer'
import { SectionPage } from '@/components/site/section-page'
import {
  getCommunityMemberState,
  getPublicCommunityThreads,
  hasCommunityGoogleAccount,
  isCommunityAdminEmail,
} from '@/community/data'
import { resolveManagedSection } from '@/content/presentation'
import { resolveLocale } from '@/i18n/locale'
import { messages } from '@/i18n/messages'
import { auth } from '@/lib/auth'

type Props={searchParams:Promise<{page?:string}>}

function pageNumber(value:string | undefined) {
  const parsed=Number.parseInt(value ?? '1',10)
  return Number.isFinite(parsed) && parsed>0 ? parsed : 1
}

export default async function GuestbookPage({searchParams}:Props) {
  const locale=await resolveLocale()
  const {page:rawPage}=await searchParams
  const page=pageNumber(rawPage)
  const t=messages[locale]
  const session=await auth.api.getSession({headers:await headers()})
  const [section,threadPage,googleConnected,member]=await Promise.all([
    resolveManagedSection('section.guestbook',locale,t.sections.guestbook),
    getPublicCommunityThreads(page,10),
    session?.user?hasCommunityGoogleAccount(session.user.id):Promise.resolve(false),
    session?.user?getCommunityMemberState(session.user.id):Promise.resolve(null),
  ])
  const viewer=session?.user?{
    name:session.user.name,
    image:session.user.image ?? null,
    googleConnected,
    blocked:member?.status==='blocked',
    isAdmin:isCommunityAdminEmail(session.user.email),
  }:null
  const threads=threadPage.items

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
              <span>{locale==='vi'?'DIỄN ĐÀN NHỎ':'MINI FORUM'}</span>
              <h2>{locale==='vi'?'Chủ đề gần đây':'Recent topics'}</h2>
            </div>
            <strong>{threadPage.total.toLocaleString(locale==='vi'?'vi-VN':'en-US')}</strong>
          </header>
          {threads.length===0 && (
            <div className="guestbook-empty">
              <strong>{locale==='vi'?'Discuss đang còn trống.':'Discuss is quiet for now.'}</strong>
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
                  <strong>
                    {thread.authorName}
                    {thread.isAdmin && <span className="discuss-admin-badge">ADMIN</span>}
                  </strong>
                  <small>{thread.createdAt.toLocaleDateString(locale==='vi'?'vi-VN':'en-GB')}</small>
                </span>
              </div>
              <div className="guestbook-thread-copy">
                <h3>{thread.title}</h3>
                <p>{thread.body}</p>
              </div>
              <div className="guestbook-thread-meta">
                <span>♡ {thread.likeCount} {locale==='vi'?'thích':'likes'}</span>
                <span>↩ {thread.replyCount} {locale==='vi'?'phản hồi':'replies'}</span>
                <time>{locale==='vi'?'HOẠT ĐỘNG':'ACTIVE'} · {thread.lastActivityAt.toLocaleDateString(locale==='vi'?'vi-VN':'en-GB')}</time>
                <b>→</b>
              </div>
            </Link>
          ))}
          {threadPage.pages>1 && (
            <nav className="guestbook-pagination" aria-label={locale==='vi'?'Phân trang chủ đề':'Topic pagination'}>
              <Link
                href={threadPage.page<=2?'/guestbook':'/guestbook?page='+(threadPage.page-1)}
                aria-disabled={threadPage.page===1}
                data-disabled={threadPage.page===1 || undefined}
              >
                ← {locale==='vi'?'TRƯỚC':'PREV'}
              </Link>
              <span>
                {locale==='vi'?'TRANG':'PAGE'} {threadPage.page} / {threadPage.pages}
              </span>
              <Link
                href={'/guestbook?page='+(threadPage.page+1)}
                aria-disabled={threadPage.page===threadPage.pages}
                data-disabled={threadPage.page===threadPage.pages || undefined}
              >
                {locale==='vi'?'SAU':'NEXT'} →
              </Link>
            </nav>
          )}
        </section>
      </div>
    </SectionPage>
  )
}
