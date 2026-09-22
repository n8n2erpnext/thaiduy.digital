import Link from 'next/link'
import { CvDocument } from '@/components/cv/cv-document'
import { SiteHeader } from '@/components/site/header'
import { resolveLocale } from '@/i18n/locale'
import {
  formatCvIssuedAt,
  getCvSnapshot,
  isCvDocumentId,
  normalizeCvDocumentId,
  shortCvFingerprint,
} from '@/server/cv/snapshots'

export const dynamic='force-dynamic'

type Props={
  searchParams:Promise<{ id?:string }>
}

export default async function VerifyPage({ searchParams }:Props) {
  const locale=await resolveLocale()
  const vi=locale==='vi'
  const { id='' }=await searchParams
  const query=normalizeCvDocumentId(id)
  const validFormat=query.length>0 && isCvDocumentId(query)
  const snapshot=validFormat?await getCvSnapshot(query):null
  const revoked=Boolean(snapshot?.revokedAt)

  return (
    <div className="verify-route">
      <div className="site-shell verify-site-shell">
        <SiteHeader locale={locale} />
        <main className="verify-main">
          <section className="verify-hero">
            <span>{vi?'XÁC THỰC TÀI LIỆU':'DOCUMENT VERIFICATION'}</span>
            <h1>{vi?'Kiểm tra một CV được phát hành từ thaiduy.digital.':'Verify a CV issued by thaiduy.digital.'}</h1>
            <p>
              {vi
                ? 'Dán mã Document ID có trên bản in hoặc PDF. Nếu mã tồn tại, trang này sẽ dựng lại đúng snapshot đã được lưu tại thời điểm phát hành.'
                : 'Paste the Document ID shown on a printed or PDF copy. If it exists, this page reconstructs the exact stored snapshot from the time it was issued.'}
            </p>
            <form className="verify-form" method="get">
              <label htmlFor="document-id">{vi?'Document ID':'Document ID'}</label>
              <div>
                <input
                  id="document-id"
                  name="id"
                  defaultValue={query}
                  placeholder="CV-20260920-1A2B3C4D5E"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button type="submit">{vi?'Kiểm tra':'Verify'}</button>
              </div>
            </form>
          </section>

          {query && !validFormat ? (
            <section className="verify-result is-invalid">
              <span>{vi?'KHÔNG HỢP LỆ':'INVALID FORMAT'}</span>
              <h2>{vi?'Mã tài liệu không đúng định dạng.':'This document ID has an invalid format.'}</h2>
              <p>{vi?'Định dạng hiện tại: CV-YYYYMMDD-XXXXXXXXXX.':'Current format: CV-YYYYMMDD-XXXXXXXXXX.'}</p>
            </section>
          ) : null}

          {validFormat && !snapshot ? (
            <section className="verify-result is-invalid">
              <span>{vi?'KHÔNG TÌM THẤY':'NOT FOUND'}</span>
              <h2>{vi?'Không có snapshot nào mang mã này.':'No issued snapshot matches this ID.'}</h2>
              <p>{vi?'Không nên xem tài liệu này là bản được phát hành từ website.':'Do not treat this document as an issued copy from the website.'}</p>
            </section>
          ) : null}

          {snapshot ? (
            <>
              <section className={`verify-result ${revoked?'is-revoked':'is-valid'}`}>
                <div className="verify-result-head">
                  <span><i />{revoked?(vi?'ĐÃ THU HỒI':'REVOKED'):(vi?'XÁC THỰC THÀNH CÔNG':'VERIFIED')}</span>
                  <Link href={`/cv/document/${encodeURIComponent(snapshot.id)}`}>
                    {vi?'Mở snapshot →':'Open snapshot →'}
                  </Link>
                </div>
                <h2>{snapshot.content.name}</h2>
                <p>{snapshot.content.headline}</p>
                <dl>
                  <div><dt>Document ID</dt><dd>{snapshot.id}</dd></div>
                  <div><dt>{vi?'Phiên bản':'Version'}</dt><dd>{snapshot.contentVersion}</dd></div>
                  <div><dt>{vi?'Phát hành':'Issued'}</dt><dd>{formatCvIssuedAt(snapshot.issuedAt,snapshot.locale)} GMT+7</dd></div>
                  <div><dt>{vi?'Ngôn ngữ':'Language'}</dt><dd>{snapshot.locale.toUpperCase()}</dd></div>
                  <div><dt>{vi?'Dấu vân tay':'Fingerprint'}</dt><dd>{shortCvFingerprint(snapshot.contentHash)}</dd></div>
                  <div className="verify-hash"><dt>SHA-256</dt><dd>{snapshot.contentHash}</dd></div>
                </dl>
                {revoked && snapshot.revocationReason ? <p className="verify-reason">{snapshot.revocationReason}</p> : null}
              </section>
              <section className="verify-document-preview">
                <header>
                  <span>{vi?'SNAPSHOT GỐC':'SOURCE SNAPSHOT'}</span>
                  <p>{vi?'So sánh nội dung bên dưới với bản PDF hoặc bản in đang được kiểm tra.':'Compare the content below with the PDF or printed copy being checked.'}</p>
                </header>
                <CvDocument snapshot={snapshot} verified />
              </section>
            </>
          ) : null}
        </main>
      </div>
    </div>
  )
}
