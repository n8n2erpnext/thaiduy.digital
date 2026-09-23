import Link from 'next/link'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { ControlLoginButton } from '@/components/control/login-button'
import { CredentialLogin } from '@/components/control/credential-login'
import { OwnerBootstrap } from '@/components/control/owner-bootstrap'
import { db } from '@/db/client'
import { user } from '@/db/auth-schema'
import { getControlIdentity } from '@/lib/control-auth'

export default async function ControlLoginPage() {
  const requestHeaders=await headers()
  const isHub=/ThaiDuyHub\//i.test(requestHeaders.get('user-agent') ?? '')
  const identity = await getControlIdentity()
  if (identity.state === 'owner') redirect('/control')

  const ownerEmail = process.env.CONTROL_OWNER_EMAIL?.trim().toLowerCase() ?? ''
  const existing = await db.select({ id: user.id }).from(user).limit(1)
  const initialized = existing.length > 0

  return (
    <main className="control-login">
      <Link className="control-login-mark" href="/">← THAIDUY.DIGITAL</Link>

      <section className="control-login-shell">
        <div className="control-login-hero">
          <div className="control-card-kicker">
            <span>CONTROL PLANE / OWNER GATE</span>
            <em>PRIVATE</em>
          </div>
          <h1>Owner access to the living systems.</h1>
          <p>Authenticate before entering the operator surface. Google is primary; password access exists only as a bounded fallback.</p>
          <div className="control-login-trace">
            <span>IDENTITY</span>
            <strong>{ownerEmail || 'OWNER NOT CONFIGURED'}</strong>
          </div>
          {identity.state === 'locked' && <strong className="control-login-alert">OWNER IDENTITY NOT CONFIGURED</strong>}
          {identity.state === 'forbidden' && <strong className="control-login-alert">THIS IDENTITY IS NOT AUTHORIZED</strong>}
        </div>

        <div className="control-auth-methods">
          {!isHub && (
            <section className="control-auth-method is-primary">
              <header><span>01 / PRIMARY</span><strong>Google OAuth</strong></header>
              <p>Use the configured owner Google identity for normal access.</p>
              <ControlLoginButton />
            </section>
          )}

          {isHub && ownerEmail && initialized && (
            <section className="control-auth-method is-primary">
              <header><span>01 / HUB SESSION</span><strong>Owner password</strong></header>
              <p>Embedded Google OAuth is intentionally avoided inside Android WebView. Sign in with the owner fallback password; use BROWSER ↗ in the Hub header when you prefer Google.</p>
              <CredentialLogin email={ownerEmail} />
            </section>
          )}

          {ownerEmail && !initialized && (
            <section className="control-auth-method">
              <header><span>02 / BOOTSTRAP</span><strong>Initialize owner</strong></header>
              <p>One-time credential bootstrap for the configured owner identity.</p>
              <OwnerBootstrap email={ownerEmail} />
            </section>
          )}

          {!isHub && ownerEmail && initialized && (
            <section className="control-auth-method">
              <header><span>02 / FALLBACK</span><strong>Password recovery path</strong></header>
              <p>Use only when the primary Google identity path is unavailable.</p>
              <CredentialLogin email={ownerEmail} />
            </section>
          )}
        </div>
      </section>
    </main>
  )
}
