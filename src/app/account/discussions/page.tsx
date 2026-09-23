import Link from 'next/link'
import { DiscussionDeleteButton } from '@/components/account/discussion-delete-button'
import { SiteHeader } from '@/components/site/header'
import { getUserCommunityItems } from '@/community/data'
import { resolveLocale } from '@/i18n/locale'
import { requireAccountSession } from '@/lib/account-auth'

function statusLabel(status:string,vi:boolean) {
  if (status==='approved') return vi?'ĐÃ DUYỆT':'APPROVED'
  if (status==='pending') return vi?'CHỜ DUYỆT':'PENDING'
  if (status==='rejected') return vi?'TỪ CHỐI':'REJECTED'
  return vi?'ẨN':'HIDDEN'
}

export default async function AccountDiscussionsPage() {
  const locale=await resolveLocale()
  const vi=locale==='vi'
  const session=await requireAccountSession()
  const data=await getUserCommunityItems(session.user.id)

  return (
    <div className="site-shell">
      <SiteHeader locale={locale}/>
      <main className="account-page account-discussions-page">
        <header className="account-hero">
          <Link href="/account">← {vi?'TÀI KHOẢN':'ACCOUNT'}</Link>
          <span>{vi?'DISCUSS / CỦA TÔI':'DISCUSS / MINE'}</span>
          <h1>{vi?'Nội dung đã đăng':'Your discussions'}</h1>
          <p>{vi
            ? 'Chỉnh sửa sẽ đưa nội dung trở lại hàng chờ duyệt. Xóa là soft-delete.'
            : 'Editing returns content to moderation. Delete is a soft-delete.'}</p>
        </header>

        <section className="account-content-section">
          <header>
            <div><span>{vi?'CHỦ ĐỀ':'TOPICS'}</span><strong>{data.threads.length}</strong></div>
          </header>
          {data.threads.length===0 && <p className="account-empty">{vi?'Bạn chưa tạo chủ đề nào.':'You have not created any topics yet.'}</p>}
          <div className="account-content-list">
            {data.threads.map(item=>(
              <article key={item.id}>
                <div>
                  <span className="account-status" data-status={item.status}>{statusLabel(item.status,vi)}</span>
                  <time>{item.updatedAt.toLocaleString(vi?'vi-VN':'en-GB')}</time>
                </div>
                <h2>{item.title}</h2>
                <p>{item.body.slice(0,220)}{item.body.length>220?'…':''}</p>
                <footer>
                  {item.status==='approved' && <Link href={'/discuss/'+item.id}>{vi?'XEM':'VIEW'} ↗</Link>}
                  <Link href={'/account/discussions/thread/'+item.id}>{vi?'SỬA':'EDIT'}</Link>
                  <DiscussionDeleteButton locale={locale} kind="thread" id={item.id}/>
                </footer>
              </article>
            ))}
          </div>
        </section>
        <section className="account-content-section">
          <header>
            <div><span>{vi?'PHẢN HỒI':'REPLIES'}</span><strong>{data.replies.length}</strong></div>
          </header>
          {data.replies.length===0 && <p className="account-empty">{vi?'Bạn chưa gửi phản hồi nào.':'You have not posted any replies yet.'}</p>}
          <div className="account-content-list">
            {data.replies.map(item=>(
              <article key={item.id}>
                <div>
                  <span className="account-status" data-status={item.status}>{statusLabel(item.status,vi)}</span>
                  <time>{item.updatedAt.toLocaleString(vi?'vi-VN':'en-GB')}</time>
                </div>
                <h2>{item.threadTitle}</h2>
                <p>{item.body.slice(0,220)}{item.body.length>220?'…':''}</p>
                <footer>
                  {item.status==='approved' && <Link href={'/discuss/'+item.threadId+'#replies'}>{vi?'XEM':'VIEW'} ↗</Link>}
                  <Link href={'/account/discussions/reply/'+item.id}>{vi?'SỬA':'EDIT'}</Link>
                  <DiscussionDeleteButton locale={locale} kind="reply" id={item.id}/>
                </footer>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
