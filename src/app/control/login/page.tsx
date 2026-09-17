import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ControlLoginButton } from '@/components/control/login-button'
import { CredentialLogin } from '@/components/control/credential-login'
import { OwnerBootstrap } from '@/components/control/owner-bootstrap'
import { db } from '@/db/client'
import { user } from '@/db/auth-schema'
import { getControlIdentity } from '@/lib/control-auth'

export default async function ControlLoginPage() {
  const identity = await getControlIdentity()
  if (identity.state === 'owner') redirect('/control')

  const ownerEmail = process.env.CONTROL_OWNER_EMAIL?.trim().toLowerCase() ?? ''
  const existing = await db.select({ id: user.id }).from(user).limit(1)
  const initialized = existing.length > 0
  return (
    <main className="control-login">
      <Link className="control-login-mark" href="/">← THAIDUY.DIGITAL</Link>
      <section className="control-login-panel">
        <p>CONTROL PLANE / OWNER GATE</p>
        <h1>Operate the living surface.</h1>
        <span>Google OAuth is primary. Password access is an owner-only fallback.</span>
        {identity.state === 'locked' && <strong>OWNER IDENTITY NOT CONFIGURED</strong>}
        {identity.state === 'forbidden' && <strong>THIS IDENTITY IS NOT AUTHORIZED</strong>}
        <ControlLoginButton />
        {ownerEmail && !initialized && <><div className="control-login-divider">ONE-TIME OWNER BOOTSTRAP</div><OwnerBootstrap email={ownerEmail} /></>}
        {ownerEmail && initialized && <><div className="control-login-divider">OR OWNER FALLBACK</div><CredentialLogin email={ownerEmail} /></>}
      </section>
    </main>
  )
}
