'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Locale } from '@/i18n/config'

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
    setCopied(true)
    globalThis.setTimeout(()=>setCopied(false),1600)
  }

  return (
    <div className="cv-toolbar" data-print-hidden="true">
      <div className="cv-ready">
        <i />
        <div>
          <strong>{vi?'Sẵn sàng in':'Ready to print'}</strong>
          <span>{status ?? documentId}</span>
        </div>
      </div>
      <div className="cv-toolbar-actions">
        <button type="button" onClick={()=>void copyId()}>
          {copied?(vi?'Đã sao chép':'Copied'):(vi?'Sao chép ID':'Copy ID')}
        </button>
        <Link href={`/verify?id=${encodeURIComponent(documentId)}`}>
          {vi?'Xác thực':'Verify'}
        </Link>
        <button type="button" onClick={()=>print(false)}>
          {vi?'In':'Print'}
        </button>
        <button type="button" className="cv-toolbar-primary" onClick={()=>print(true)}>
          {vi?'Lưu PDF':'Save PDF'}
        </button>
      </div>
    </div>
  )
}
