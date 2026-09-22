import { permanentRedirect } from 'next/navigation'

type Props={searchParams:Promise<{page?:string;q?:string}>}

export default async function LegacyDiscussRedirect({searchParams}:Props) {
  const {page,q}=await searchParams
  const params=new URLSearchParams()
  if (page) params.set('page',page)
  if (q) params.set('q',q)
  const query=params.toString()
  permanentRedirect('/discuss'+(query?'?'+query:''))
}
