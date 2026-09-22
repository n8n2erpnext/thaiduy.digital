import { headers } from 'next/headers'
import Link from 'next/link'
import { DiscussComposer } from '@/components/discuss/discuss-composer'
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

type Props={searchParams:Promise<{page?:string;q?:string}>}

function pageNumber(value:string | undefined) {
  const parsed=Number.parseInt(value ?? '1',10)
  return Number.isFinite(parsed) && parsed>0 ? parsed : 1
}

function discussHref(page:number,q:string) {
  const params=new URLSearchParams()
  if (page>1) params.set('page',String(page))
  if (q) params.set('q',q)
  const query=params.toString()
  return '/discuss'+(query?'?'+query:'')
}

export default async function DiscussPage({searchParams}:Props) {
  const locale=await resolveLocale()
  const {page:rawPage,q:rawQuery}=await searchParams
  const page=pageNumber(rawPage)
  const q=(rawQuery ?? '').trim().slice(0,100)
  const t=messages[locale]
  const session=await auth.api.getSession({headers:await headers()})
  const [section,threadPage,googleConnected,member]=await Promise.all([
    resolveManagedSection('section.guestbook',locale,t.sections.guestbook),
    getPublicCommunityThreads(page,10,q),
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
      <div className="discuss-page">
        <DiscussComposer locale={locale} viewer={viewer} />

        <form className="discuss-public-search" method="get">
          <input
            type="search"
            name="q"
            defaultValue={q}
            maxLength={100}
            placeholder={locale==='vi'?'Tìm chủ đề hoặc nội dung…':'Search topics or content…'}
          />
          <button type="submit">{locale==='vi'?'TÌM':'SEARCH'}</button>
          {q && <Link href="/discuss">{locale==='vi'?'XÓA':'CLEAR'}</Link>}
        </form>

        <section className="discuss-thread-list">
          <header>
            <div>
              <span>{locale==='vi'?'DIỄN ĐÀN NHỎ':'MINI FORUM'}</span>
              <h2>
                {q
                  ? (locale==='vi'?'Kết quả tìm kiếm':'Search results')
                  : (locale==='vi'?'Chủ đề gần đây':'Recent topics')}
              </h2>
            </div>
            <strong>{threadPage.total.toLocaleString(locale==='vi'?'vi-VN':'en-US')}</strong>
          </header>
          {threads.length===0 && (
            <div className="discuss-empty">
              <strong>
                {q
                  ? (locale==='vi'?'Không tìm thấy chủ đề phù hợp.':'No matching topics found.')
                  : (locale==='vi'?'Discuss đang còn trống.':'Discuss is quiet for now.')}
              </strong>
              <p>
                {q
                  ? (locale==='vi'?'Thử từ khóa khác hoặc xóa bộ lọc tìm kiếm.':'Try another keyword or clear the search.')
                  : (locale==='vi'?'Bạn có thể là người mở lời đầu tiên.':'You can be the first person to leave a message.')}
              </p>
            </div>
          )}
          {threads.map(thread=>(
            <Link className="discuss-thread-card" href={'/discuss/'+thread.id} key={thread.id}>
              <div className="discuss-thread-author">
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
              <div className="discuss-thread-copy">
                <h3>{thread.title}</h3>
                <p>{thread.body}</p>
              </div>
              <div className="discuss-thread-meta">
                {thread.pinned && <span className="discuss-public-flag">PINNED</span>}
                {thread.locked && <span className="discuss-public-flag">LOCKED</span>}
                <span>♡ {thread.likeCount} {locale==='vi'?'thích':'likes'}</span>
                <span>↩ {thread.replyCount} {locale==='vi'?'phản hồi':'replies'}</span>
                <time>{locale==='vi'?'HOẠT ĐỘNG':'ACTIVE'} · {thread.lastActivityAt.toLocaleDateString(locale==='vi'?'vi-VN':'en-GB')}</time>
                <b>→</b>
              </div>
            </Link>
          ))}
          {threadPage.pages>1 && (
            <nav className="discuss-pagination" aria-label={locale==='vi'?'Phân trang chủ đề':'Topic pagination'}>
              <Link
                href={discussHref(Math.max(1,threadPage.page-1),q)}
                aria-disabled={threadPage.page===1}
                data-disabled={threadPage.page===1 || undefined}
              >
                ← {locale==='vi'?'TRƯỚC':'PREV'}
              </Link>
              <span>
                {locale==='vi'?'TRANG':'PAGE'} {threadPage.page} / {threadPage.pages}
              </span>
              <Link
                href={discussHref(Math.min(threadPage.pages,threadPage.page+1),q)}
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
