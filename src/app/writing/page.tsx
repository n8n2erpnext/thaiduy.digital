import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ManagedBlocks } from '@/components/surfaces/managed-blocks'
import { SectionPage } from '@/components/site/section-page'
import { WritingTagChip } from '@/components/writing/tag-chip'
import { resolveManagedSection } from '@/content/presentation'
import { getPublishedPosts, localizedPost, type PostRow } from '@/content/posts'
import { resolveLocale } from '@/i18n/locale'
import { messages } from '@/i18n/messages'
import { paginateWriting, WRITING_MAX_HIGHLIGHTS } from '@/content/writing-index'

type Props = {
  searchParams:Promise<{ page?:string }>
}

function pageNumber(value:string | undefined) {
  const parsed = Number.parseInt(value ?? '1',10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

function PostCard({
  post,
  locale,
  highlight = false,
}:{
  post:PostRow
  locale:'en'|'vi'
  highlight?:boolean
}) {
  const copy = localizedPost(post,locale)
  return (
    <article className={'writing-post-card' + (highlight ? ' is-highlight' : '')}>
      {post.coverUrl && (
        <div className="writing-post-cover">
          <Link href={'/writing/' + post.slug}>
            <img src={post.coverUrl} alt={copy.coverAlt ?? ''} />
          </Link>
          {copy.coverSource === 'unsplash' && copy.coverCreditName && (
            <div className="writing-photo-credit">
              {locale === 'vi' ? 'Ảnh của ' : 'Photo by '}
              <a href={copy.coverCreditUrl ?? '#'} target="_blank" rel="noopener noreferrer">
                {copy.coverCreditName}
              </a>{' '}
              {locale === 'vi' ? 'trên ' : 'on '}
              <a href={copy.coverSourceUrl ?? 'https://unsplash.com'} target="_blank" rel="noopener noreferrer">
                Unsplash
              </a>
            </div>
          )}
        </div>
      )}
      <Link className="writing-post-card-body" href={'/writing/' + post.slug}>
        <div className="writing-post-card-meta">
          <span>{post.publishedAt?.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-GB')}</span>
          <span>{highlight ? (locale === 'vi' ? 'NỔI BẬT' : 'HIGHLIGHT') : (locale === 'vi' ? 'BÀI VIẾT' : 'POST')}</span>
        </div>
        <h2>{copy.title}</h2>
        {copy.excerpt && <p>{copy.excerpt}</p>}
        {post.tagRecords.some(tag=>tag.enabled) && (
          <div className="writing-post-tags">
            {post.tagRecords.filter(tag=>tag.enabled).map(tag => (
              <WritingTagChip key={tag.id} tag={tag} />
            ))}
          </div>
        )}
        <strong>{locale === 'vi' ? 'ĐỌC BÀI →' : 'READ →'}</strong>
      </Link>
    </article>
  )
}

export default async function Page({ searchParams }:Props) {
  const locale = await resolveLocale()
  const t = messages[locale]
  const { page:rawPage } = await searchParams
  const page = pageNumber(rawPage)

  const [section,posts] = await Promise.all([
    resolveManagedSection('section.writing',locale,t.sections.writing),
    getPublishedPosts(),
  ])
  if (!section.visible) notFound()

  const pagination = paginateWriting(posts,page)
  const { highlights,items:visibleRegular,totalPages } = pagination

  if (page > totalPages && posts.length > 0) notFound()

  const hasPosts = posts.length > 0

  return (
    <SectionPage
      locale={locale}
      eyebrow={section.eyebrow}
      title={section.title}
      copy={section.copy}
      managed={section.managed}
    >
      {hasPosts ? (
        <>
          {page === 1 && highlights.length > 0 && (
            <section className="writing-highlight-section">
              <header>
                <span>{locale === 'vi' ? 'NỔI BẬT' : 'HIGHLIGHT'}</span>
                <small>{highlights.length} / {WRITING_MAX_HIGHLIGHTS}</small>
              </header>
              <div className="writing-highlight-grid">
                {highlights.map(post => (
                  <PostCard key={post.id} post={post} locale={locale} highlight />
                ))}
              </div>
            </section>
          )}

          {visibleRegular.length > 0 && (
            <section className="writing-post-grid" data-page={page}>
              {visibleRegular.map(post => (
                <PostCard key={post.id} post={post} locale={locale} />
              ))}
            </section>
          )}

          {totalPages > 1 && (
            <nav className="writing-pagination" aria-label={locale === 'vi' ? 'Phân trang bài viết' : 'Writing pagination'}>
              <Link
                href={page <= 2 ? '/writing' : '/writing?page=' + (page - 1)}
                aria-disabled={page === 1}
                data-disabled={page === 1 || undefined}
              >
                ← {locale === 'vi' ? 'TRƯỚC' : 'PREV'}
              </Link>
              <div>
                {Array.from({length:totalPages},(_,index) => index + 1).map(number => (
                  <Link
                    key={number}
                    href={number === 1 ? '/writing' : '/writing?page=' + number}
                    aria-current={number === page ? 'page' : undefined}
                  >
                    {String(number).padStart(2,'0')}
                  </Link>
                ))}
              </div>
              <Link
                href={'/writing?page=' + (page + 1)}
                aria-disabled={page === totalPages}
                data-disabled={page === totalPages || undefined}
              >
                {locale === 'vi' ? 'SAU' : 'NEXT'} →
              </Link>
            </nav>
          )}
        </>
      ) : (
        <ManagedBlocks locale={locale} parentKey="writing" empty={t.section.empty} />
      )}
    </SectionPage>
  )
}
