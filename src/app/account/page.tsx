/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { AccountProfileForm } from '@/components/account/account-profile-form'
import { SiteHeader } from '@/components/site/header'
import { getAccountOverview } from '@/account/data'
import { resolveLocale } from '@/i18n/locale'
import { requireAccountSession } from '@/lib/account-auth'

export default async function AccountPage() {
  const locale=await resolveLocale()
  const vi=locale==='vi'
  const session=await requireAccountSession()
  const account=await getAccountOverview(session.user.id)
  if (!account) return null
  const providers=account.providers.map(item=>item.providerId).join(', ') || '—'

  return (
    <div className="site-shell">
      <SiteHeader locale={locale}/>
      <main className="account-page">
        <header className="account-hero">
          <span>{vi?'TÀI KHOẢN':'ACCOUNT'}</span>
          <h1>{vi?'Tài khoản của bạn':'Your account'}</h1>
          <p>{vi
            ? 'Một nơi nhỏ để quản danh tính hiển thị và nội dung bạn đã đăng trong Discuss.'
            : 'A small place to manage your display identity and the content you have posted in Discuss.'}</p>
        </header>
        <section className="account-profile-card">
          <div className="account-profile-identity">
            {account.image
              ? <img src={account.image} alt=""/>
              : <i>{account.name.slice(0,2).toUpperCase()}</i>}
            <div>
              <strong>{account.name}</strong>
              <span>{account.email}</span>
            </div>
          </div>
          <dl>
            <div><dt>{vi?'NHÀ CUNG CẤP':'PROVIDER'}</dt><dd>{providers}</dd></div>
            <div><dt>{vi?'EMAIL XÁC MINH':'EMAIL VERIFIED'}</dt><dd>{account.emailVerified?'YES':'NO'}</dd></div>
            <div><dt>{vi?'THAM GIA':'JOINED'}</dt><dd>{account.createdAt.toLocaleDateString(vi?'vi-VN':'en-GB')}</dd></div>
          </dl>
          <AccountProfileForm locale={locale} initialName={account.name}/>
        </section>

        <Link className="account-discussions-link" href="/account/discussions">
          <span>{vi?'NỘI DUNG CỦA TÔI':'MY DISCUSSIONS'}</span>
          <strong>{vi?'Quản chủ đề và phản hồi đã đăng':'Manage your topics and replies'}</strong>
          <b>→</b>
        </Link>
      </main>
    </div>
  )
}
