import { and, eq } from 'drizzle-orm'
import { account } from '@/db/auth-schema'
import { db } from '@/db/client'
import { requireControlOwner } from '@/lib/control-auth'
import { ChangePasswordForm } from '@/components/control/change-password'
import { setFallbackPassword } from './actions'

export default async function ControlAccountPage({ searchParams }: PageProps<'/control/account'>) {
  const session = await requireControlOwner()
  const params = await searchParams
  const credential = await db.select({ id: account.id }).from(account).where(and(
    eq(account.userId, session.user.id),
    eq(account.providerId, 'credential'),
  )).limit(1)

  const hasPassword = credential.length > 0
  return (
    <section className="control-section">
      <div className="control-section-head"><div><p>OWNER IDENTITY</p><h1>Account</h1></div><span>{hasPassword ? 'GOOGLE + PASSWORD' : 'GOOGLE ONLY'}</span></div>
      <div className="control-account-card">
        <span>OWNER EMAIL</span><strong>{session.user.email}</strong>
        <small>Google OAuth is the primary identity. Password access is fallback only.</small>
      </div>
      {!hasPassword && (
        <form className="control-form" action={setFallbackPassword}>
          <label><span>SET FALLBACK PASSWORD</span><input name="newPassword" type="password" minLength={12} required autoComplete="new-password" /></label>
          <button className="control-primary-button" type="submit">SET PASSWORD</button>
        </form>
      )}
      {hasPassword && <>
        <div className="control-account-card"><span>FALLBACK STATUS</span><strong>READY</strong><small>Email/password sign-in is available on the owner gate.</small></div>
        <ChangePasswordForm />
      </>}
      {params.ok && <p className="control-flash success">PASSWORD FALLBACK UPDATED</p>}
      {params.error && <p className="control-flash error">PASSWORD UPDATE FAILED — SIGN IN WITH GOOGLE AGAIN AND RETRY</p>}
    </section>
  )
}
