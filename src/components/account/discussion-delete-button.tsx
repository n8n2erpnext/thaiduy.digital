'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props={
  locale:'en'|'vi'
  kind:'thread'|'reply'
  id:string
  redirectAfter?:boolean
}

export function DiscussionDeleteButton({locale,kind,id,redirectAfter=false}:Props) {
  const vi=locale==='vi'
  const router=useRouter()
  const [busy,setBusy]=useState(false)

  async function remove() {
    const confirmed=window.confirm(vi
      ? 'Xóa nội dung này khỏi Discuss? Hành động sẽ được lưu dưới dạng soft-delete.'
      : 'Remove this content from Discuss? It will be retained as a soft-delete.')
    if (!confirmed) return
    setBusy(true)
    try {
      const response=await fetch('/api/account/discussions/'+kind+'/'+id,{method:'DELETE'})
      if (!response.ok) return
      if (redirectAfter) router.push('/account/discussions')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <button className="account-danger-button" type="button" disabled={busy} onClick={()=>void remove()}>
      {busy?(vi?'ĐANG XÓA…':'REMOVING…'):(vi?'XÓA':'DELETE')}
    </button>
  )
}
