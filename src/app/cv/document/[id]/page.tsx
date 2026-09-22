import { notFound } from 'next/navigation'
import { CvActions } from '@/components/cv/cv-actions'
import { CvDocument } from '@/components/cv/cv-document'
import { SiteHeader } from '@/components/site/header'
import { getCvSnapshot } from '@/server/cv/snapshots'

export const dynamic='force-dynamic'

type Props={
  params:Promise<{ id:string }>
}

export default async function CvSnapshotPage({ params }:Props) {
  const { id }=await params
  const snapshot=await getCvSnapshot(id)
  if (!snapshot) notFound()

  const vi=snapshot.locale==='vi'
  return (
    <div className="cv-route">
      <div className="site-shell cv-site-shell">
        <SiteHeader locale={snapshot.locale} />
        <main className="cv-main">
          <section className="cv-verified-banner" data-print-hidden="true">
            <span><i />{vi?'SNAPSHOT ĐÃ XÁC THỰC':'VERIFIED SNAPSHOT'}</span>
            <p>
              {vi
                ? 'Nội dung bên dưới được đọc trực tiếp từ snapshot đã lưu khi mã tài liệu được phát hành.'
                : 'The document below is rendered directly from the immutable snapshot stored when this ID was issued.'}
            </p>
          </section>
          <div className="cv-document-stage">
            <CvDocument snapshot={snapshot} verified />
            <CvActions documentId={snapshot.id} name={snapshot.content.name} locale={snapshot.locale} />
          </div>
        </main>
      </div>
    </div>
  )
}
