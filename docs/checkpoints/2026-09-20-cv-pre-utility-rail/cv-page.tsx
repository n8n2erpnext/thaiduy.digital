import type { Metadata } from 'next'
import { CvActions } from '@/components/cv/cv-actions'
import { CvDocument } from '@/components/cv/cv-document'
import { SiteHeader } from '@/components/site/header'
import { resolveLocale } from '@/i18n/locale'
import { issueCvSnapshot } from '@/server/cv/snapshots'

export const dynamic='force-dynamic'

export const metadata:Metadata={
  title:'CV — Thái Đăng Duy',
  description:'Verifiable, print-ready CV snapshot issued by thaiduy.digital.',
}

export default async function CvPage() {
  const locale=await resolveLocale()
  const snapshot=await issueCvSnapshot(locale)
  const vi=locale==='vi'

  return (
    <div className="cv-route">
      <div className="site-shell cv-site-shell">
        <SiteHeader locale={locale} />
        <main className="cv-main">
          <section className="cv-page-intro" data-print-hidden="true">
            <div>
              <span>{vi?'CV / TÀI LIỆU CÓ THỂ XÁC THỰC':'CV / VERIFIABLE DOCUMENT'}</span>
              <h1>{vi?'Hồ sơ nghề nghiệp, phát hành theo từng snapshot.':'A career document issued as a verifiable snapshot.'}</h1>
            </div>
            <p>
              {vi
                ? 'Mỗi lần mở trang này tạo một mã tài liệu mới và lưu nội dung tại thời điểm phát hành. Bản PDF in ra có thể được đối chiếu lại bằng chính mã đó.'
                : 'Each visit issues a new document ID and stores the content at that exact moment. A printed or PDF copy can later be checked against that immutable snapshot.'}
            </p>
          </section>
          <CvActions documentId={snapshot.id} name={snapshot.content.name} locale={locale} />
          <CvDocument snapshot={snapshot} />
        </main>
      </div>
    </div>
  )
}
