import Link from 'next/link'
import { SignOutButton } from './sign-out-button'

type Props = {
  email: string
  children: React.ReactNode
}

const links = [
  ['OVERVIEW', '/control'],
  ['CONTENT', '/control/content'],
  ['ASSETS', '/control/assets'],
  ['RUNTIME', '/control/runtime'],
  ['TRAFFIC', '/control/traffic'],
  ['BRAINS', '/control/brains'],
  ['SETTINGS', '/control/settings'],
  ['ACCOUNT', '/control/account'],
  ['AUDIT', '/control/audit'],
] as const

export function ControlShell({ email, children }: Props) {
  return (
    <div className="control-root">
      <aside className="control-sidebar">
        <div className="control-brand"><strong>TD / CONTROL</strong><small>living systems operator</small></div>
        <nav>{links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav>
        <div className="control-user">
          <span>OWNER SESSION</span>
          <small>{email}</small>
          <SignOutButton />
        </div>
      </aside>
      <main className="control-main">{children}</main>
    </div>
  )
}
