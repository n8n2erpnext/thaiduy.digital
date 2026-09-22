import { permanentRedirect } from 'next/navigation'

type Props={
  params:Promise<{id:string}>
  searchParams:Promise<{page?:string}>
}

export default async function LegacyDiscussThreadRedirect({params,searchParams}:Props) {
  const {id}=await params
  const {page}=await searchParams
  permanentRedirect('/discuss/'+encodeURIComponent(id)+(page?'?page='+encodeURIComponent(page):''))
}
