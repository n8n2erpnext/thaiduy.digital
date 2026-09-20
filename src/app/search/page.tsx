import Link from 'next/link'
import { SiteHeader } from '@/components/site/header'
import { WritingTagChip } from '@/components/writing/tag-chip'
import { getPublishedPosts,localizedPost } from '@/content/posts'
import { getRegistry } from '@/content/repository'
import { textFor } from '@/content/types'
import { resolveLocale } from '@/i18n/locale'

type Props = { searchParams:Promise<{ q?:string }> }

function normalize(value:string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/đ/g,'d')
    .toLowerCase()
}

function score(haystack:string,query:string) {
  const source = normalize(haystack)
  const target = normalize(query)
  if (!target) return 0
  if (source === target) return 100
  if (source.startsWith(target)) return 60
  if (source.includes(target)) return 30
  return target.split(/\s+/).filter(Boolean).reduce((sum,part) => sum + (source.includes(part) ? 5 : 0),0)
}

export default async function SearchPage({ searchParams }:Props) {
  const locale = await resolveLocale()
  const { q:rawQuery } = await searchParams
  const query = (rawQuery ?? '').trim().slice(0,120)

  const [posts,projects,nav] = await Promise.all([
    getPublishedPosts(),
    getRegistry('project'),
    getRegistry('nav'),
  ])

  const results = query ? [
    ...posts.map(post => {
      const copy = localizedPost(post,locale)
      return {
        key:'writing:' + post.id,
        kind:locale === 'vi' ? 'BÀI VIẾT' : 'WRITING',
        title:copy.title,
        description:copy.excerpt ?? '',
        href:'/writing/' + post.slug,
        tags:post.tags,
        tagRecords:post.tagRecords.filter(tag=>tag.enabled),
        score:score([copy.title,copy.excerpt ?? '',...post.tagRecords.map(tag=>tag.name)].join(' '),query),
      }
    }),
    ...projects.map(project => ({
      key:'project:' + project.id,
      kind:'PROJECT',
      title:textFor(project.label,locale),
      description:[textFor(project.title,locale),textFor(project.summary,locale)].filter(Boolean).join(' · '),
      href:'/projects/' + project.key,
      tags:[String(project.meta?.plane ?? ''),String(project.meta?.mode ?? '')].filter(Boolean),
      tagRecords:[],
      score:score([
        textFor(project.label,locale),
        textFor(project.title,locale),
        textFor(project.summary,locale),
        String(project.meta?.plane ?? ''),
        String(project.meta?.mode ?? ''),
      ].join(' '),query),
    })),
    ...nav.map(item => ({
      key:'nav:' + item.id,
      kind:locale === 'vi' ? 'ĐIỀU HƯỚNG' : 'NAVIGATION',
      title:textFor(item.label,locale),
      description:textFor(item.title,locale) || textFor(item.summary,locale),
      href:String(item.meta?.href ?? '/'),
      tags:[],
      tagRecords:[],
      score:score([
        textFor(item.label,locale),
        textFor(item.title,locale),
        textFor(item.summary,locale),
      ].join(' '),query),
    })),
  ]
    .filter(result => result.score > 0)
    .sort((a,b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0,40) : []

  return (
    <div className="site-shell search-page">
      <SiteHeader locale={locale} />
      <main>
        <header className="search-page-head">
          <span>{locale === 'vi' ? 'TÌM KIẾM' : 'SEARCH'}</span>
          <h1>{locale === 'vi' ? 'Tìm trên website' : 'Search the site'}</h1>
          <form action="/search" method="get">
            <input
              name="q"
              type="search"
              defaultValue={query}
              autoFocus
              placeholder={locale === 'vi' ? 'Bài viết, project, trang…' : 'Writing, projects, pages…'}
            />
            <button type="submit">{locale === 'vi' ? 'TÌM' : 'SEARCH'}</button>
          </form>
        </header>

        {query ? (
          <section className="search-results">
            <div className="search-results-head">
              <span>{results.length} {locale === 'vi' ? 'KẾT QUẢ' : 'RESULTS'}</span>
              <strong>“{query}”</strong>
            </div>
            {results.length > 0 ? (
              <div className="search-result-list">
                {results.map(result => (
                  <Link href={result.href} className="search-result" key={result.key}>
                    <div>
                      <span>{result.kind}</span>
                      <h2>{result.title}</h2>
                      {result.description && <p>{result.description}</p>}
                      {(result.tagRecords.length > 0 || result.tags.length > 0) && (
                        <div>
                          {result.tagRecords.length > 0
                            ? result.tagRecords.map(tag => <WritingTagChip key={tag.id} tag={tag} />)
                            : result.tags.map(tag => <small key={tag}>#{tag}</small>)}
                        </div>
                      )}
                    </div>
                    <b>→</b>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="search-empty">
                <strong>{locale === 'vi' ? 'Không tìm thấy nội dung phù hợp.' : 'No matching public content.'}</strong>
                <p>{locale === 'vi' ? 'Thử từ khóa ngắn hơn hoặc tên project.' : 'Try a shorter term, tag or project name.'}</p>
              </div>
            )}
          </section>
        ) : (
          <section className="search-empty">
            <strong>{locale === 'vi' ? 'Nhập từ khóa để bắt đầu.' : 'Type something to start searching.'}</strong>
            <p>{locale === 'vi' ? 'Search chỉ đọc nội dung public.' : 'Search only reads public site content.'}</p>
          </section>
        )}
      </main>
    </div>
  )
}
