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
    <section className="control-page control-account-page">
      <header className="control-page-head">
        <p>CONTROL / ACCOUNT</p>
        <h1>Owner identity</h1>
        <span>One operator identity, one primary sign-in path, and one bounded fallback for recovery.</span>
      </header>

      <div className="control-account-grid">
        <section className="control-account-identity">
          <div className="control-card-kicker">
            <span>OWNER IDENTITY</span>
            <em>ACTIVE</em>
          </div>
          <h2>{session.user.email}</h2>
          <p>Google OAuth remains the primary identity for this control plane.</p>
          <div className="control-account-meta">
            <div><span>PRIMARY</span><strong>GOOGLE OAUTH</strong></div>
            <div><span>FALLBACK</span><strong>{hasPassword ? 'READY' : 'NOT SET'}</strong></div>
          </div>
        </section>

        <section className="control-account-security">
          <div className="control-card-kicker">
            <span>FALLBACK ACCESS</span>
            <em>{hasPassword ? 'CONFIGURED' : 'OPTIONAL'}</em>
          </div>
          <h2>{hasPassword ? 'Rotate fallback password' : 'Set fallback password'}</h2>
          <p>Password access is recovery-only. Google remains the normal owner gate.</p>
          {hasPassword ? (
            <ChangePasswordForm />
          ) : (
            <form className="control-form" action={setFallbackPassword}>
              <label>
                <span>NEW PASSWORD · 12+ CHARACTERS</span>
                <input name="newPassword" type="password" minLength={12} required autoComplete="new-password" />
              </label>
              <button className="control-primary-button" type="submit">SET FALLBACK PASSWORD</button>
            </form>
          )}
        </section>
      </div>

      {params.ok && <p className="control-flash success">PASSWORD FALLBACK UPDATED</p>}
      {params.error && <p className="control-flash error">PASSWORD UPDATE FAILED — SIGN IN WITH GOOGLE AGAIN AND RETRY</p>}
    </section>
  )
}
