import Link from 'next/link'
import { SiteHeader } from '@/components/site/header'
import { TopAtmosphere } from '@/components/home/top-atmosphere'
import { resolveLocale } from '@/i18n/locale'

export default async function NotFound() {
  const locale=await resolveLocale()
  const vi=locale==='vi'

  const copy=vi?{
    eyebrow:'SYSTEM / ROUTE MISS',
    title:'Không tìm thấy đường dẫn này.',
    body:'Trang có thể đã được di chuyển, đổi tên hoặc chưa từng tồn tại. Các bề mặt công khai chính vẫn ở đây.',
    home:'VỀ TRANG CHỦ',
    projects:'DỰ ÁN',
    writing:'BÀI VIẾT',
    stack:'HẠ TẦNG',
    note:'HTTP 404 · KHÔNG CÓ TÀI NGUYÊN Ở ĐƯỜNG DẪN NÀY',
  }:{
    eyebrow:'SYSTEM / ROUTE MISS',
    title:'This route is not part of the living surface.',
    body:'The page may have moved, changed identity, or never existed. The primary public surfaces are still reachable below.',
    home:'BACK HOME',
    projects:'PROJECTS',
    writing:'WRITING',
    stack:'STACK',
    note:'HTTP 404 · NO RESOURCE BOUND TO THIS ROUTE',
  }
  return (
    <div className="not-found-page">
      <TopAtmosphere />
      <div className="site-shell not-found-shell">
        <SiteHeader locale={locale} />
        <main className="not-found-main">
          <div className="not-found-code" aria-hidden="true">
            <strong>404</strong>
            <span>ROUTE / UNBOUND</span>
          </div>
          <section className="not-found-copy">
            <span>{copy.eyebrow}</span>
            <h1>{copy.title}</h1>
            <p>{copy.body}</p>
            <nav aria-label={vi?'Điều hướng thay thế':'Alternative navigation'}>
              <Link href="/">{copy.home} ↗</Link>
              <Link href="/projects">{copy.projects} ↗</Link>
              <Link href="/writing">{copy.writing} ↗</Link>
              <Link href="/stack">{copy.stack} ↗</Link>
            </nav>
            <small>{copy.note}</small>
          </section>
        </main>
      </div>
    </div>
  )
}
