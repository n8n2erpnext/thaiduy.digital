import Link from 'next/link'
import type { CvExperience } from '@/content/cv'
import type { CvSnapshot } from '@/server/cv/snapshots'
import { formatCvIssuedAt, shortCvFingerprint } from '@/server/cv/snapshots'

type Props = {
  snapshot: CvSnapshot
  verified?: boolean
}

function ExperienceBlock({ job, index }:{ job:CvExperience; index:number }) {
  return (
    <article className="cv-experience" data-cv-avoid-break>
      <div className="cv-experience-index">{String(index+1).padStart(2,'0')}</div>
      <div className="cv-experience-body">
        <div className="cv-experience-head">
          <div>
            <h3>{job.company}</h3>
            <p>{job.role}</p>
          </div>
          <time>{job.period}</time>
        </div>
        <ul>{job.bullets.map(item=><li key={item}>{item}</li>)}</ul>
      </div>
    </article>
  )
}

function DocumentMeta({ snapshot }:{ snapshot:CvSnapshot }) {
  const vi=snapshot.locale==='vi'
  return (
    <footer className="cv-document-meta">
      <span><b>{vi?'Mã tài liệu':'Document ID'}</b> {snapshot.id}</span>
      <span><b>{vi?'Dấu vân tay':'Fingerprint'}</b> {shortCvFingerprint(snapshot.contentHash)}</span>
      <span><b>{vi?'Phát hành':'Issued'}</b> {formatCvIssuedAt(snapshot.issuedAt,snapshot.locale)} GMT+7</span>
      <span><b>{vi?'Xác thực':'Verify'}</b> thaiduy.digital/verify</span>
    </footer>
  )
}

export function CvDocument({ snapshot, verified=false }:Props) {
  const { content }=snapshot
  const vi=snapshot.locale==='vi'
  const firstExperience=content.experience.slice(0,2)
  const remainingExperience=content.experience.slice(2)

  return (
    <article className="cv-document" data-cv-document>
      <section className="cv-sheet cv-sheet-one">
        <header className="cv-doc-header">
          <div className="cv-doc-kicker">
            <span>{content.version} / {vi?'CURRICULUM VITAE':'CURRICULUM VITAE'}</span>
            <span className="cv-doc-state">
              <i />
              {verified
                ? (vi?'BẢN GỐC ĐÃ XÁC THỰC':'VERIFIED SOURCE SNAPSHOT')
                : (vi?'SNAPSHOT SẴN SÀNG IN':'SNAPSHOT READY TO PRINT')}
            </span>
          </div>
          <div className="cv-identity">
            <div>
              <h1>{content.name}</h1>
              <p>{content.headline}</p>
            </div>
            <div className="cv-contact-block">
              <span>{content.location}</span>
              <a href={`tel:${content.phone.replaceAll(' ','')}`}>{content.phone}</a>
              <a href={`mailto:${content.email}`}>{content.email}</a>
              <a href={`https://${content.website}`}>{content.website}</a>
              <a href={`https://${content.github}`}>{content.github}</a>
            </div>
          </div>
        </header>

        <div className="cv-rule" />

        <section className="cv-summary" data-cv-avoid-break>
          <div className="cv-section-label">01 / {vi?'TÓM TẮT':'PROFILE'}</div>
          <p>{content.summary}</p>
          <div className="cv-focus">
            {content.focus.map((item,index)=>(
              <span key={item}><b>0{index+1}</b>{item}</span>
            ))}
          </div>
        </section>

        <section className="cv-section">
          <div className="cv-section-label">02 / {vi?'KINH NGHIỆM':'EXPERIENCE'}</div>
          <div className="cv-experience-list">
            {firstExperience.map((job,index)=><ExperienceBlock key={job.company} job={job} index={index} />)}
          </div>
        </section>

        <section className="cv-skill-strip" data-cv-avoid-break>
          <div className="cv-section-label">03 / {vi?'NĂNG LỰC CỐT LÕI':'CORE CAPABILITIES'}</div>
          <div className="cv-skill-grid">
            {content.skills.slice(0,2).map(group=>(
              <div key={group.label}>
                <strong>{group.label}</strong>
                <p>{group.items.join(' · ')}</p>
              </div>
            ))}
          </div>
        </section>
        <DocumentMeta snapshot={snapshot} />
      </section>

      <section className="cv-sheet cv-sheet-two">
        <header className="cv-page-two-head">
          <div>
            <span>{content.name}</span>
            <strong>{vi?'KINH NGHIỆM & HỆ THỐNG':'EXPERIENCE & SYSTEMS'}</strong>
          </div>
          <span>{snapshot.id}</span>
        </header>

        <section className="cv-section">
          <div className="cv-section-label">04 / {vi?'KINH NGHIỆM · TIẾP':'EXPERIENCE · CONTINUED'}</div>
          <div className="cv-experience-list">
            {remainingExperience.map((job,index)=>(
              <ExperienceBlock key={job.company} job={job} index={index+firstExperience.length} />
            ))}
          </div>
        </section>

        <section className="cv-section cv-systems-section">
          <div className="cv-section-label">05 / {vi?'HỆ THỐNG TIÊU BIỂU':'SELECTED SYSTEMS'}</div>
          <div className="cv-system-grid">
            {content.systems.map((system,index)=>(
              <article key={system.name} className="cv-system-card" data-cv-avoid-break>
                <span>0{index+1}</span>
                <h3>{system.name}</h3>
                <strong>{system.role}</strong>
                <p>{system.summary}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="cv-section cv-bottom-grid" data-cv-avoid-break>
          <div>
            <div className="cv-section-label">06 / {vi?'HƯỚNG KỸ THUẬT':'TECHNICAL DIRECTION'}</div>
            <div className="cv-technical-list">
              {content.skills.slice(2).map(group=>(
                <div key={group.label}>
                  <strong>{group.label}</strong>
                  <p>{group.items.join(' · ')}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="cv-education">
            <div className="cv-section-label">07 / {vi?'HỌC VẤN':'EDUCATION'}</div>
            <strong>{content.education.school}</strong>
            <p>{content.education.credential}</p>
            <Link className="cv-verify-link" href={`/verify?id=${encodeURIComponent(snapshot.id)}`}>
              {vi?'Xác thực tài liệu này →':'Verify this document →'}
            </Link>
          </div>
        </section>
        <DocumentMeta snapshot={snapshot} />
      </section>
    </article>
  )
}
