import type { Metadata } from 'next'
import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site/header'
import { ArticleReader } from '@/components/writing/article-reader'
import { ArticleEngagement } from '@/components/writing/article-engagement'
import { WritingTagChip } from '@/components/writing/tag-chip'
import { prepareArticleBody } from '@/content/article-presentation'
import { getArticleEngagement,hasGoogleAccount } from '@/content/engagement'
import { getPublishedPostBySlug, localizedPost } from '@/content/posts'
import { resolveLocale } from '@/i18n/locale'
import { auth } from '@/lib/auth'

type Props = { params: Promise<{ slug:string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const [post,locale] = await Promise.all([
    getPublishedPostBySlug(slug),
    resolveLocale(),
  ])
  if (!post) return {}
  const copy = localizedPost(post,locale)
  return {
    title:copy.seoTitle || copy.title,
    description:copy.seoDescription || undefined,
    openGraph:{
      title:copy.seoTitle || copy.title,
      description:copy.seoDescription || undefined,
      type:'article',
      publishedTime:post.publishedAt?.toISOString(),
      modifiedTime:post.updatedAt.toISOString(),
      images:post.coverUrl ? [{ url:post.coverUrl, alt:copy.coverAlt ?? copy.title }] : undefined,
    },
  }
}
export default async function WritingPostPage({ params }: Props) {
  const { slug } = await params
  const locale = await resolveLocale()
  const post = await getPublishedPostBySlug(slug)
  if (!post) notFound()
  const copy = localizedPost(post,locale)
  const article = await prepareArticleBody(copy.body)
  const session = await auth.api.getSession({ headers:await headers() })
  const [engagement,googleConnected] = await Promise.all([
    getArticleEngagement(post.id,session?.user.id),
    session?.user ? hasGoogleAccount(session.user.id) : Promise.resolve(false),
  ])
  const dateLocale = locale === 'vi' ? 'vi-VN' : 'en-GB'
  const labels = locale === 'vi'
    ? {
        back:'← BÀI VIẾT',
        author:'Người viết',
        published:'Đăng ngày',
        updated:'Cập nhật',
        reading:'Thời gian đọc',
        minutes:article.readingMinutes + ' phút',
        toc:'Trong bài này',
        end:'HẾT BÀI',
        all:'← TẤT CẢ BÀI VIẾT',
        projects:'XEM PROJECTS →',
      }
    : {
        back:'← WRITING',
        author:'Written by',
        published:'Published on',
        updated:'Updated',
        reading:'Reading time',
        minutes:article.readingMinutes + ' min',
        toc:'On this page',
        end:'END OF ARTICLE',
        all:'← ALL WRITING',
        projects:'EXPLORE PROJECTS →',
      }

  return (
    <div className="site-shell writing-detail-page">
      <SiteHeader locale={locale} />
      <main>
        <article className="writing-article" id="writing-article">
          <header className="writing-article-hero">
            <div className="writing-article-breadcrumb">
              <Link href="/writing">{labels.back}</Link>
            </div>
            <h1>{copy.title}</h1>
            {copy.excerpt && <p>{copy.excerpt}</p>}
            <div className="writing-article-facts">
              <div>
                <span>{labels.author}</span>
                <strong className="writing-author">
                  <i>TD</i>
                  <b>Thái Duy</b>
                </strong>
              </div>
              <div>
                <span>{labels.published}</span>
                <strong>{post.publishedAt?.toLocaleDateString(dateLocale)}</strong>
              </div>
              <div>
                <span>{labels.updated}</span>
                <strong>{post.updatedAt.toLocaleDateString(dateLocale)}</strong>
              </div>
              <div>
                <span>{labels.reading}</span>
                <strong>{labels.minutes}</strong>
              </div>
            </div>
            {post.tagRecords.some(tag=>tag.enabled) && (
              <div className="writing-article-tags">
                {post.tagRecords.filter(tag=>tag.enabled).map(tag => (
                  <WritingTagChip
                    key={tag.id}
                    tag={tag}
                    href={'/search?q=' + encodeURIComponent(tag.name)}
                  />
                ))}
              </div>
            )}
          </header>

          {post.coverUrl && (
            <figure className="writing-article-cover">
              <img src={post.coverUrl} alt={copy.coverAlt ?? ''} />
              {copy.coverSource === 'unsplash' && copy.coverCreditName && (
                <figcaption className="writing-photo-credit">
                  Photo by{' '}
                  <a href={copy.coverCreditUrl ?? '#'} target="_blank" rel="noopener noreferrer">
                    {copy.coverCreditName}
                  </a>{' '}
                  on{' '}
                  <a href={copy.coverSourceUrl ?? 'https://unsplash.com'} target="_blank" rel="noopener noreferrer">
                    Unsplash
                  </a>
                </figcaption>
              )}
            </figure>
          )}
          <div className="writing-article-layout">
            <div className="writing-article-column">
              <div
                className="writing-article-body"
                dangerouslySetInnerHTML={{ __html:article.body }}
              />

              <footer className="writing-article-footer">
                <span>{labels.end}</span>
                <div>
                  <Link href="/writing">{labels.all}</Link>
                  <Link href="/projects">{labels.projects}</Link>
                </div>
              </footer>

              <ArticleEngagement
                slug={post.slug}
                locale={locale}
                initialLikeCount={engagement.likeCount}
                initialLiked={engagement.liked}
                comments={engagement.comments.map(comment => ({
                  ...comment,
                  createdAt:comment.createdAt.toISOString(),
                }))}
                viewer={session?.user ? {
                  name:session.user.name,
                  image:session.user.image ?? null,
                  googleConnected,
                } : null}
              />
            </div>

            <ArticleReader
              toc={article.toc}
              articleId="writing-article"
              label={labels.toc}
            />
          </div>
        </article>
      </main>
    </div>
  )
}
