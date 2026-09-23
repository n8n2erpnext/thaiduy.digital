import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DiscussionEditForm } from '@/components/account/discussion-edit-form'
import { SiteHeader } from '@/components/site/header'
import { getCommunityParticipants,getOwnedCommunityItem } from '@/community/data'
import { resolveLocale } from '@/i18n/locale'
import { requireAccountSession } from '@/lib/account-auth'

type Props={params:Promise<{kind:string;id:string}>}

export default async function AccountDiscussionEditPage({params}:Props) {
  const locale=await resolveLocale()
  const vi=locale==='vi'
  const session=await requireAccountSession()
  const {kind:rawKind,id}=await params
  if (rawKind!=='thread' && rawKind!=='reply') notFound()
  const kind=rawKind
  const item=await getOwnedCommunityItem(kind,id,session.user.id)
  if (!item) notFound()
  const participants=kind==='reply'
    ? await getCommunityParticipants(item.threadId)
    : []

  return (
    <div className="site-shell">
      <SiteHeader locale={locale}/>
      <main className="account-page account-edit-page">
        <header className="account-hero">
          <Link href="/account/discussions">← {vi?'NỘI DUNG CỦA TÔI':'MY DISCUSSIONS'}</Link>
          <span>{kind==='thread'?(vi?'CHỈNH CHỦ ĐỀ':'EDIT TOPIC'):(vi?'CHỈNH PHẢN HỒI':'EDIT REPLY')}</span>
          <h1>{kind==='thread'
            ? item.title
            : (vi?'Chỉnh phản hồi':'Edit reply')}</h1>
          <p>{vi
            ? 'Sau khi lưu, nội dung sẽ quay lại hàng chờ duyệt.'
            : 'After saving, this content will return to the moderation queue.'}</p>
        </header>
        <DiscussionEditForm
          locale={locale}
          kind={kind}
          id={item.id}
          initialTitle={kind==='thread'?item.title:undefined}
          initialBody={item.body}
          initialBodyHtml={item.bodyHtml}
          participants={participants}
        />
      </main>
    </div>
  )
}
