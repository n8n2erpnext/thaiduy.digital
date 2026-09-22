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
            <span className="cv-page-intro-eyebrow">{vi?'CV / TÀI LIỆU CÓ THỂ XÁC THỰC':'CV / VERIFIABLE DOCUMENT'}</span>
            <h1>{vi?'Hồ sơ nghề nghiệp có thể xác thực.':'A verifiable career record.'}</h1>
            <p>
              {vi
                ? 'Mỗi lần mở trang sẽ phát hành một Document ID và lưu nguyên snapshot này. Dùng ID hoặc QR trên PDF để đối chiếu lại đúng bản đã phát hành.'
                : 'Each visit issues a Document ID and preserves this exact snapshot. Use the ID or QR on the PDF to verify the issued copy later.'}
            </p>
          </section>
          <div className="cv-document-stage">
            <CvDocument snapshot={snapshot} />
            <CvActions documentId={snapshot.id} name={snapshot.content.name} locale={locale} />
          </div>
        </main>
      </div>
    </div>
  )
}
