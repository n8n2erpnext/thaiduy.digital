'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Locale } from '@/i18n/config'
import { trackAnalyticsEvent } from '@/lib/analytics-client'

type Props = {
  documentId: string
  name: string
  locale: Locale
}

function fileTitle(name:string,id:string) {
  const normalized=name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replaceAll('Đ','D')
    .replaceAll('đ','d')
    .replace(/[^a-z0-9]+/gi,'')
  return `CV_${normalized || 'ThaiDangDuy'}_${id}`
}

export function CvActions({ documentId, name, locale }:Props) {
  const vi=locale==='vi'
  const [copied,setCopied]=useState(false)
  const [status,setStatus]=useState<string|null>(null)

  const print=(pdf:boolean)=>{
    trackAnalyticsEvent(pdf?'cv_pdf':'cv_print',{
      surface:'cv',
      locale,
      action:pdf?'save_pdf':'print',
    })
    setStatus(pdf
      ? (vi?'Đang mở hộp thoại in — chọn “Save as PDF”.':'Opening print dialog — choose “Save as PDF”.')
      : (vi?'Đang chuẩn bị bản in…':'Preparing print copy…'))
    const previous=document.title
    document.title=fileTitle(name,documentId)
    globalThis.addEventListener('afterprint',()=>{
      document.title=previous
      setStatus(null)
    },{once:true})
    globalThis.setTimeout(()=>globalThis.print(),120)
  }

  const copyId=async()=>{
    await navigator.clipboard.writeText(documentId)
    trackAnalyticsEvent('cv_copy_id',{
      surface:'cv',
      locale,
      action:'copy_document_id',
    })
    setCopied(true)
    globalThis.setTimeout(()=>setCopied(false),1600)
  }

  return (
    <aside className="cv-utility-rail" data-print-hidden="true" aria-label={vi?'Công cụ tài liệu':'Document tools'}>
      <div className="cv-utility-status">
        <div className="cv-utility-state">
          <i />
          <strong>{vi?'Sẵn sàng in':'Ready to print'}</strong>
        </div>
        <span>{status ?? documentId}</span>
      </div>
      <div className="cv-utility-actions">
        <button type="button" onClick={()=>void copyId()}>
          <span>{vi?'Document ID':'Document ID'}</span>
          <strong>{copied?(vi?'Đã sao chép':'Copied'):(vi?'Sao chép':'Copy')}</strong>
        </button>
        <Link
          href={`/verify?id=${encodeURIComponent(documentId)}`}
          onClick={()=>trackAnalyticsEvent('cv_verify',{
            surface:'cv',
            locale,
            action:'verify_document',
          })}
        >
          <span>{vi?'Nguồn':'Source'}</span>
          <strong>{vi?'Xác thực':'Verify'}</strong>
        </Link>
        <button type="button" onClick={()=>print(false)}>
          <span>{vi?'Bản giấy':'Paper'}</span>
          <strong>{vi?'In':'Print'}</strong>
        </button>
        <button type="button" className="cv-utility-primary" onClick={()=>print(true)}>
          <span>PDF</span>
          <strong>{vi?'Lưu PDF':'Save PDF'}</strong>
        </button>
      </div>
    </aside>
  )
}
